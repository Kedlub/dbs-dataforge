import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addHours, addDays, startOfDay, isAfter } from 'date-fns';
import { getAuthSession } from '@/lib/auth';
import { getSystemSettings } from '@/lib/settings';
import { Prisma } from '@/../generated/prisma';

export async function GET(request: NextRequest) {
	try {
		const session = await getAuthSession();
		const searchParams = request.nextUrl.searchParams;

		// Use userId from query params only for admins/employees, otherwise use the authenticated user's ID
		let userId = searchParams.get('userId');

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
		}

		// If user is not admin/employee and tries to access other user's reservations, restrict to their own
		if (
			userId &&
			userId !== session.user.id &&
			session.user.role !== 'admin' &&
			session.user.role !== 'employee'
		) {
			userId = session.user.id;
		}

		// If no userId specified, use the authenticated user's ID
		if (!userId) {
			userId = session.user.id;
		}

		const reservations = await prisma.reservation.findMany({
			where: {
				userId: userId
			},
			include: {
				timeSlot: true,
				activity: true
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return NextResponse.json(reservations);
	} catch (error) {
		console.error('Error fetching reservations:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch reservations' },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
		}

		// Fetch System Settings
		const settings = await getSystemSettings();

		const data = await request.json();
		// Validate input data structure (basic check, Zod could be used for more robust validation)
		const { facilityId, activityId, slotId } = data; // Use slotId directly

		if (!facilityId || !activityId || !slotId) {
			return NextResponse.json(
				{ error: 'Chybějící pole: facilityId, activityId nebo slotId' },
				{ status: 400 }
			);
		}

		// --- Reservation Rule Checks ---

		// 1. Check Max Active Reservations
		// Using the custom DB function
		const activeReservationsResult: [{ count: number }] =
			await prisma.$queryRaw`SELECT check_user_active_reservations(${session.user.id}::text) as count`;
		const activeReservationsCount = activeReservationsResult[0]?.count ?? 0;

		if (activeReservationsCount >= settings.maxActiveReservationsPerUser) {
			return NextResponse.json(
				{
					error: `Překročen maximální počet aktivních rezervací (${settings.maxActiveReservationsPerUser}).`
				},
				{ status: 400 }
			);
		}

		// 2. Find and Validate Time Slot (includes facility check implicitly)
		const timeSlot = await prisma.timeSlot.findUnique({
			where: {
				id: slotId,
				facilityId: facilityId, // Ensure slot belongs to the specified facility
				isAvailable: true, // Ensure slot is available
				startTime: {
					gte: new Date() // Ensure slot is in the future
				}
			}
		});

		if (!timeSlot) {
			return NextResponse.json(
				{ error: 'Vybraný časový slot není platný nebo již není k dispozici.' },
				{ status: 400 }
			);
		}

		// 3. Check Max Booking Lead Days
		const now = new Date();
		const maxBookingDate = startOfDay(
			addDays(now, settings.maxBookingLeadDays)
		);
		const requestedDate = startOfDay(timeSlot.startTime);

		if (isAfter(requestedDate, maxBookingDate)) {
			return NextResponse.json(
				{
					error: `Rezervaci lze vytvořit maximálně ${settings.maxBookingLeadDays} dní dopředu.`
				},
				{ status: 400 }
			);
		}

		// 4. Find Activity and check if it belongs to the facility
		const activity = await prisma.activity.findUnique({
			where: { id: activityId, isActive: true } // Ensure activity is active
		});

		if (!activity) {
			return NextResponse.json(
				{ error: 'Aktivita nebyla nalezena nebo není aktivní.' },
				{ status: 404 }
			);
		}

		// Check if this activity is offered at this facility
		const facilityActivity = await prisma.facilityActivity.findUnique({
			where: {
				facilityId_activityId: {
					facilityId: facilityId,
					activityId: activityId
				}
			}
		});

		if (!facilityActivity) {
			return NextResponse.json(
				{ error: 'Tato aktivita není na vybraném sportovišti nabízena.' },
				{ status: 400 }
			);
		}

		// --- Create Reservation (Transaction) ---
		const reservation = await prisma.$transaction(async (tx) => {
			// Re-check availability inside transaction for safety
			const slotInTx = await tx.timeSlot.findUnique({
				where: { id: slotId, isAvailable: true }
			});
			if (!slotInTx) {
				throw new Error('Slot became unavailable'); // Transaction will rollback
			}

			// Create the reservation
			const newReservation = await tx.reservation.create({
				data: {
					userId: session.user.id,
					slotId: timeSlot.id,
					activityId: activityId,
					status: 'pending', // Default to pending
					totalPrice: activity.price
				}
			});

			// Mark the time slot as unavailable
			await tx.timeSlot.update({
				where: { id: timeSlot.id },
				data: { isAvailable: false }
			});

			return newReservation;
		});

		return NextResponse.json(reservation);
	} catch (error: any) {
		console.error('Error creating reservation:', error);
		if (error.message === 'Slot became unavailable') {
			return NextResponse.json(
				{ error: 'Časový slot byl právě obsazen jinou rezervací.' },
				{ status: 409 } // Conflict status code
			);
		}
		return NextResponse.json(
			{ error: 'Nepodařilo se vytvořit rezervaci' },
			{ status: 500 }
		);
	}
}
