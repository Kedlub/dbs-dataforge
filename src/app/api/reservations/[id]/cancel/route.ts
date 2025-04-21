import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // More specific import for the error type

// Input validation schema
const cancelSchema = z.object({
	cancellationReason: z.string().min(1, 'Důvod zrušení je povinný.')
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: 'Reservation ID is required' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validation = cancelSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const { cancellationReason } = validation.data;

		// Fetch reservation to get slotId
		const reservation = await prisma.reservation.findUnique({
			where: { id },
			select: { slotId: true, status: true }
		});

		if (!reservation) {
			return NextResponse.json(
				{ error: 'Reservation not found' },
				{ status: 404 }
			);
		}

		// Prevent cancelling already cancelled reservations
		if (reservation.status === 'cancelled') {
			return NextResponse.json(
				{ error: 'Reservation is already cancelled' },
				{ status: 409 } // Conflict
			);
		}

		// Use a transaction to ensure atomicity
		await prisma.$transaction(async (tx) => {
			// 1. Call the stored procedure to update reservation status and reason
			// Use executeRawUnsafe because stored procedure calls might not be fully type-safe recognized by Prisma
			await tx.$executeRawUnsafe<void>(
				'CALL cancel_reservation($1::TEXT, $2::TEXT)',
				id,
				cancellationReason
			);

			// 2. If the reservation had a time slot, mark it as available
			if (reservation.slotId) {
				await tx.timeSlot.update({
					where: { id: reservation.slotId },
					data: { isAvailable: true }
				});
			}
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		// Specify error type as any or perform type checking
		console.error('Error cancelling reservation:', error);
		// Handle potential database errors like constraint violations if needed
		if (error instanceof PrismaClientKnownRequestError) {
			// Log specific Prisma errors if helpful
			console.error('Prisma Error Code:', error.code);
		}
		return NextResponse.json(
			{ error: 'Failed to cancel reservation' },
			{ status: 500 }
		);
	}
}
