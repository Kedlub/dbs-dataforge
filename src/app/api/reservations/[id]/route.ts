import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Define possible reservation statuses
const ReservationStatus = z.enum(['pending', 'confirmed', 'cancelled']);

// Input validation schema for PATCH
const updateSchema = z
	.object({
		status: ReservationStatus.optional(),
		cancellationReason: z.string().nullable().optional(),
		internalNotes: z.string().nullable().optional(),
		slotId: z.string().uuid('Invalid Time Slot ID').optional() // Add slotId
	})
	.refine(
		(data) =>
			data.status !== undefined ||
			data.cancellationReason !== undefined ||
			data.internalNotes !== undefined ||
			data.slotId !== undefined, // Add slotId to refine condition
		{
			message:
				'At least one field (status, cancellationReason, internalNotes, or slotId) must be provided for update'
		}
	);

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;
		if (!id) {
			return NextResponse.json(
				{ error: 'Reservation ID is required' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validation = updateSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const { status, cancellationReason, internalNotes, slotId } =
			validation.data;
		const newSlotId = slotId; // Alias for clarity in transaction

		// Use transaction for all updates to ensure atomicity
		const updatedReservation = await prisma.$transaction(async (tx) => {
			// 1. Fetch existing reservation and related slot details within the transaction
			const existingReservation = await tx.reservation.findUnique({
				where: { id },
				include: {
					timeSlot: { select: { id: true, facilityId: true } } // Select necessary fields
				}
			});

			if (!existingReservation) {
				// Throw an error to abort the transaction
				throw new Error('Reservation not found');
			}

			const oldSlotId = existingReservation.slotId;
			let dataToUpdate: Record<string, any> = {};

			// 2. Handle Time Slot Change (if newSlotId is provided)
			if (newSlotId && newSlotId !== oldSlotId) {
				// Fetch the new target time slot
				const newSlot = await tx.timeSlot.findUnique({
					where: { id: newSlotId }
				});

				if (!newSlot) {
					throw new Error('New time slot not found');
				}

				// Validation: Check if the new slot is available
				if (!newSlot.isAvailable) {
					throw new Error('Selected time slot is no longer available');
				}

				// Validation: Check if the new slot is for the same facility
				if (newSlot.facilityId !== existingReservation.timeSlot?.facilityId) {
					throw new Error('Cannot move reservation to a different facility');
				}

				// Mark the new slot as unavailable
				await tx.timeSlot.update({
					where: { id: newSlotId },
					data: { isAvailable: false }
				});

				// Make the old slot available again (if it existed and status wasn't cancelled)
				if (oldSlotId && existingReservation.status !== 'cancelled') {
					await tx.timeSlot.update({
						where: { id: oldSlotId },
						data: { isAvailable: true }
					});
				}

				// Add slotId to the reservation update data
				dataToUpdate.slotId = newSlotId;
			}

			// 3. Handle Status Change
			if (status !== undefined) {
				dataToUpdate.status = status;

				// Handle cancellation reason based on status
				if (status !== 'cancelled') {
					dataToUpdate.cancellationReason = null;
				} else if (cancellationReason !== undefined) {
					// Only set cancellation reason if status is 'cancelled'
					dataToUpdate.cancellationReason = cancellationReason;
				}

				// Update timeslot availability based on status changes (if slot wasn't changed)
				if (!newSlotId && oldSlotId) {
					if (status === 'cancelled') {
						await tx.timeSlot.update({
							where: { id: oldSlotId },
							data: { isAvailable: true }
						});
					} else if (existingReservation.status === 'cancelled') {
						// Attempt to re-book the slot if changing status FROM cancelled
						const currentOldSlot = await tx.timeSlot.findUnique({
							where: { id: oldSlotId }
						});
						if (currentOldSlot?.isAvailable) {
							await tx.timeSlot.update({
								where: { id: oldSlotId },
								data: { isAvailable: false }
							});
						} else {
							throw new Error(
								'Cannot update status: Original time slot is no longer available.'
							);
						}
					}
				}
			}

			// 4. Handle Internal Notes Change
			if (internalNotes !== undefined) {
				dataToUpdate.internalNotes = internalNotes;
			}

			// 5. Perform the Reservation Update (if there's anything to update)
			if (Object.keys(dataToUpdate).length === 0) {
				// No actual changes requested, return existing reservation
				return existingReservation;
			}

			const updated = await tx.reservation.update({
				where: { id },
				data: dataToUpdate
			});

			return updated;
		});

		return NextResponse.json(updatedReservation);
	} catch (error: any) {
		console.error('Error updating reservation:', error);

		// Handle specific transaction errors
		if (error.message === 'Reservation not found') {
			return NextResponse.json({ error: error.message }, { status: 404 });
		}
		if (
			error.message === 'New time slot not found' ||
			error.message === 'Cannot move reservation to a different facility'
		) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		if (
			error.message === 'Selected time slot is no longer available' ||
			error.message ===
				'Cannot update status: Original time slot is no longer available.'
		) {
			return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
		}

		// Handle Zod validation errors specifically
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid input', details: error.errors },
				{ status: 400 }
			);
		}

		// Generic error handler
		return NextResponse.json(
			{ error: 'Failed to update reservation' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;

		if (!id) {
			return NextResponse.json(
				{ error: 'Reservation ID is required' },
				{ status: 400 }
			);
		}

		// Check if reservation exists
		const existingReservation = await prisma.reservation.findUnique({
			where: { id },
			include: {
				timeSlot: true
			}
		});

		if (!existingReservation) {
			return NextResponse.json(
				{ error: 'Reservation not found' },
				{ status: 404 }
			);
		}

		// Make the time slot available again before deleting
		if (existingReservation.timeSlot) {
			await prisma.timeSlot.update({
				where: { id: existingReservation.timeSlot.id },
				data: { isAvailable: true }
			});
		}

		// Delete the reservation
		await prisma.reservation.delete({
			where: { id }
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting reservation:', error);
		return NextResponse.json(
			{ error: 'Failed to delete reservation' },
			{ status: 500 }
		);
	}
}
