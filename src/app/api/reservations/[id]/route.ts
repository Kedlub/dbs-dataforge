import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;
		const data = await request.json();

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

		// Update the reservation
		const updatedReservation = await prisma.reservation.update({
			where: { id },
			data: {
				status: data.status,
				cancellationReason: data.cancellationReason
			}
		});

		// If the reservation is cancelled, make the time slot available again
		if (data.status === 'cancelled' && existingReservation.timeSlot) {
			await prisma.timeSlot.update({
				where: { id: existingReservation.timeSlot.id },
				data: { isAvailable: true }
			});
		}

		return NextResponse.json(updatedReservation);
	} catch (error) {
		console.error('Error updating reservation:', error);
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
