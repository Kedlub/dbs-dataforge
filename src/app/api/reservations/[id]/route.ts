import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getSystemSettings } from '@/lib/settings'; // Import settings getter
import {
	isBefore,
	addHours,
	subHours,
	startOfDay,
	addDays,
	isAfter
} from 'date-fns'; // Import date-fns

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
		const newSlotId = slotId;

		// Fetch System Settings for validation
		const settings = await getSystemSettings();

		// Use transaction for all updates to ensure atomicity
		const updatedReservation = await prisma.$transaction(async (tx) => {
			// 1. Fetch existing reservation and related slot details
			const existingReservation = await tx.reservation.findUnique({
				where: { id },
				include: {
					timeSlot: true // Include full timeslot for start time
				}
			});

			if (!existingReservation || !existingReservation.timeSlot) {
				throw new Error('Reservation or its time slot not found');
			}

			const oldSlotId = existingReservation.slotId;
			let dataToUpdate: Record<string, any> = {};

			// Check Cancellation Deadline if status is being set to 'cancelled'
			if (status === 'cancelled') {
				const now = new Date();
				const reservationStartTime = new Date(
					existingReservation.timeSlot.startTime
				);
				const cancellationDeadline = subHours(
					reservationStartTime,
					settings.cancellationDeadlineHours
				);

				if (isBefore(cancellationDeadline, now)) {
					throw new Error(
						`Rezervaci nelze zrušit méně než ${settings.cancellationDeadlineHours} hodin před jejím začátkem.`
					);
				}
			}

			// 2. Handle Time Slot Change (if newSlotId is provided)
			if (newSlotId && newSlotId !== oldSlotId) {
				// Fetch the new target time slot
				const newSlot = await tx.timeSlot.findUnique({
					where: { id: newSlotId }
				});

				if (!newSlot) {
					throw new Error('Nový časový slot nebyl nalezen');
				}

				// Validation: Check if the new slot is available
				if (!newSlot.isAvailable) {
					throw new Error('Vybraný nový časový slot již není k dispozici');
				}

				// Validation: Check if the new slot is for the same facility
				if (newSlot.facilityId !== existingReservation.timeSlot?.facilityId) {
					throw new Error('Rezervaci nelze přesunout na jiné sportoviště');
				}

				// Validation: Check Max Booking Lead Days for the *new* slot
				const nowForNewSlot = new Date();
				const maxBookingDateNew = startOfDay(
					addDays(nowForNewSlot, settings.maxBookingLeadDays)
				);
				const requestedDateNew = startOfDay(newSlot.startTime);
				if (isAfter(requestedDateNew, maxBookingDateNew)) {
					throw new Error(
						`Nový termín rezervace lze zvolit maximálně ${settings.maxBookingLeadDays} dní dopředu.`
					);
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
						// Check deadline again inside transaction before making slot available
						const now = new Date();
						const reservationStartTime = new Date(
							existingReservation.timeSlot.startTime
						);
						const cancellationDeadline = subHours(
							reservationStartTime,
							settings.cancellationDeadlineHours
						);
						if (isBefore(cancellationDeadline, now)) {
							throw new Error(
								`Rezervaci nelze zrušit méně než ${settings.cancellationDeadlineHours} hodin před jejím začátkem (kontrola v transakci).`
							);
						}

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
								'Nelze aktualizovat status: Původní časový slot již není dostupný.'
							);
						}
					}
				}
			}

			// 4. Handle Internal Notes Change
			if (internalNotes !== undefined) {
				dataToUpdate.internalNotes = internalNotes;
			}

			// 5. Perform the Reservation Update
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

		// Handle custom errors thrown within the transaction
		if (
			error.message.startsWith('Rezervaci nelze zrušit') ||
			error.message.startsWith('Nový časový slot') ||
			error.message.startsWith('Rezervaci nelze přesunout') ||
			error.message.startsWith('Nelze aktualizovat status') ||
			error.message.startsWith('Nový termín rezervace lze zvolit')
		) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		if (error.message === 'Reservation or its time slot not found') {
			return NextResponse.json({ error: error.message }, { status: 404 });
		}
		if (error.message === 'Vybraný nový časový slot již není k dispozici') {
			return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
		}

		// Handle specific transaction errors (fallback, less specific)
		if (error.message === 'Reservation not found') {
			// Less specific fallback
			return NextResponse.json({ error: error.message }, { status: 404 });
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
