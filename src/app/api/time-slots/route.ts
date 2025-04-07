import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { TimeSlot } from '@/lib/types';

// Define an interface for TimeSlot with reservations
interface TimeSlotWithReservations {
	id: string;
	facilityId: string;
	startTime: Date;
	endTime: Date;
	isAvailable: boolean;
	reservations: any[];
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const facilityId = searchParams.get('facilityId');
		const dateParam = searchParams.get('date');

		if (!facilityId) {
			return NextResponse.json(
				{ error: 'Facility ID is required' },
				{ status: 400 }
			);
		}

		// Set up base query for time slots
		const query: any = {
			where: {
				facilityId: facilityId
			},
			orderBy: {
				startTime: 'asc'
			},
			include: {
				reservations: true
			}
		};

		// Add date filter if provided
		if (dateParam) {
			const date = new Date(dateParam);
			query.where.startTime = {
				gte: startOfDay(date),
				lte: endOfDay(date)
			};
		}

		// Get time slots with their reservations
		const timeSlots = await prisma.timeSlot.findMany(query);

		// Mark slots as unavailable if they have reservations
		const processedTimeSlots = timeSlots.map((slot: any) => {
			// Create a new object without reservations
			const { reservations, ...slotWithoutReservations } = slot;

			return {
				...slotWithoutReservations,
				isAvailable: slot.isAvailable && reservations.length === 0
			};
		});

		return NextResponse.json(processedTimeSlots);
	} catch (error) {
		console.error('Error fetching time slots:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch time slots' },
			{ status: 500 }
		);
	}
}
