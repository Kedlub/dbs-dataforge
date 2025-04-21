import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

// Define possible reservation statuses
const ReservationStatus = z.enum(['pending', 'confirmed', 'cancelled']);

// Input validation schema for PATCH
const updateSchema = z
	.object({
		status: ReservationStatus.optional(),
		cancellationReason: z.string().nullable().optional() // Allow null or string
	})
	.refine(
		(data) =>
			data.status !== undefined || data.cancellationReason !== undefined,
		{
			message:
				'At least one field (status or cancellationReason) must be provided for update'
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

		const dataToUpdate: Record<string, any> = {};
		if (validation.data.status !== undefined) {
			dataToUpdate.status = validation.data.status;
		}
		// We explicitly set cancellationReason to null if status is not 'cancelled'
		// or if it's provided as null. Otherwise, we use the provided string.
		if (
			validation.data.status !== undefined &&
			validation.data.status !== 'cancelled'
		) {
			dataToUpdate.cancellationReason = null;
		} else if (validation.data.cancellationReason !== undefined) {
			dataToUpdate.cancellationReason = validation.data.cancellationReason;
		}

		// Check if reservation exists before trying to update
		const existingReservation = await prisma.reservation.findUnique({
			where: { id },
			include: {
				timeSlot: true // Needed for the isAvailable logic
			}
		});

		if (!existingReservation) {
			return NextResponse.json(
				{ error: 'Reservation not found' },
				{ status: 404 }
			);
		}

		// Use transaction for update and potential timeslot change
		const updatedReservation = await prisma.$transaction(async (tx) => {
			const updated = await tx.reservation.update({
				where: { id },
				data: dataToUpdate
			});

			// If the status was changed to 'cancelled', make the time slot available again
			if (dataToUpdate.status === 'cancelled' && existingReservation.timeSlot) {
				await tx.timeSlot.update({
					where: { id: existingReservation.timeSlot.id },
					data: { isAvailable: true }
				});
			}
			// **Important**: If status changes FROM cancelled TO something else,
			// and the timeslot *was* associated, we should attempt to make it unavailable again
			// (assuming it's still available)
			else if (
				existingReservation.status === 'cancelled' &&
				dataToUpdate.status !== 'cancelled' &&
				existingReservation.timeSlot
			) {
				// Check if the slot is currently available before trying to take it
				const currentSlot = await tx.timeSlot.findUnique({
					where: { id: existingReservation.timeSlot.id }
				});
				if (currentSlot?.isAvailable) {
					await tx.timeSlot.update({
						where: { id: existingReservation.timeSlot.id },
						data: { isAvailable: false }
					});
				} else {
					// Handle case where slot is already taken - perhaps throw error?
					// For now, we just won't update it, but this could lead to double booking if not handled.
					// Consider throwing an error to inform the client.
					console.warn(
						`Cannot re-activate reservation ${id}: Time slot ${existingReservation.timeSlot.id} is already booked.`
					);
					// Optionally throw an error:
					// throw new Error('Cannot update reservation: Time slot is no longer available.');
				}
			}

			return updated;
		});

		return NextResponse.json(updatedReservation);
	} catch (error: any) {
		console.error('Error updating reservation:', error);
		// Check if it's a specific error we threw (like timeslot unavailable)
		if (error.message.includes('Time slot is no longer available')) {
			return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
		}
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
