import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { parseISO, startOfDay, endOfDay, isFuture } from 'date-fns';

// Schema to validate query parameters
const querySchema = z.object({
	facilityId: z.string().uuid('Invalid Facility ID'),
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, use YYYY-MM-DD')
		.transform((dateStr) => parseISO(dateStr)) // Convert string to Date object
});

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const queryParams = Object.fromEntries(searchParams.entries());

	try {
		// Validate query parameters
		const validation = querySchema.safeParse(queryParams);
		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid query parameters', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const { facilityId, date } = validation.data;

		// Calculate the start and end of the selected day
		const startOfSelectedDay = startOfDay(date);
		const endOfSelectedDay = endOfDay(date);
		const now = new Date(); // Get current time

		// Fetch available time slots
		const availableSlots = await prisma.timeSlot.findMany({
			where: {
				facilityId: facilityId,
				isAvailable: true,
				startTime: {
					gte: startOfSelectedDay, // Greater than or equal to the start of the day
					lt: endOfSelectedDay, // Less than the end of the day
					// Ensure we only show slots that haven't started yet
					// If the selected date is today, filter by slots starting after 'now'
					// If the selected date is in the future, this condition is automatically met
					...(startOfDay(now).getTime() === startOfSelectedDay.getTime()
						? { gte: now }
						: {})
				}
			},
			orderBy: {
				startTime: 'asc' // Order by start time
			},
			select: {
				// Select only necessary fields to send to the client
				id: true,
				startTime: true,
				endTime: true
			}
		});

		// Further filter in code to ensure start time is strictly in the future
		// (Database filtering might have slight precision issues depending on execution time)
		const futureSlots = availableSlots.filter((slot) =>
			isFuture(slot.startTime)
		);

		return NextResponse.json(futureSlots);
	} catch (error: any) {
		console.error('Error fetching available time slots:', error);
		if (error instanceof z.ZodError) {
			// This case should be caught by safeParse, but added for robustness
			return NextResponse.json(
				{ error: 'Invalid input data', details: error.errors },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to fetch available time slots' },
			{ status: 500 }
		);
	}
}
