import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';

// Validation schema for query parameters
const schema = z.object({
	facilityId: z.string().uuid('Invalid Facility ID'),
	// Make activityId optional as it's not needed for filtering slots by date/facility
	// but might be sent by the manual reservation dialog
	activityId: z.string().uuid('Invalid Activity ID').optional(),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
});

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const params = Object.fromEntries(searchParams.entries());

		// Validate query parameters
		const validation = schema.safeParse(params);
		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid query parameters', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const { facilityId, date } = validation.data;
		const selectedDate = new Date(date);

		// Calculate the start and end of the selected day in UTC
		// Important: Adjust if your server/db timezone handling differs
		const dayStart = startOfDay(selectedDate);
		const dayEnd = endOfDay(selectedDate);

		// Find available time slots for the facility on the selected date
		const availableSlots = await prisma.timeSlot.findMany({
			where: {
				facilityId: facilityId,
				isAvailable: true,
				startTime: {
					gte: dayStart, // Greater than or equal to the start of the day
					lt: dayEnd // Less than the end of the day
				}
			},
			orderBy: {
				startTime: 'asc' // Order slots chronologically
			}
		});

		return NextResponse.json(availableSlots);
	} catch (error: any) {
		console.error('Error fetching available time slots:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid query parameters', details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: 'Failed to fetch available time slots' },
			{ status: 500 }
		);
	}
}
