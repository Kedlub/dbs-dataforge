import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addHours } from 'date-fns';
import { getAuthSession } from '@/lib/auth';

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

		const data = await request.json();
		const { facilityId, activityId, startTime } = data;

		if (!facilityId || !activityId || !startTime) {
			return NextResponse.json(
				{
					error: 'Missing required fields: facilityId, activityId, or startTime'
				},
				{ status: 400 }
			);
		}

		// Find the facility to check if it exists
		const facility = await prisma.facility.findUnique({
			where: { id: facilityId }
		});

		if (!facility) {
			return NextResponse.json(
				{ error: 'Facility not found' },
				{ status: 404 }
			);
		}

		// Find the activity to check if it exists and get price
		const activity = await prisma.activity.findUnique({
			where: { id: activityId }
		});

		if (!activity) {
			return NextResponse.json(
				{ error: 'Activity not found' },
				{ status: 404 }
			);
		}

		// Find all facilities with the same name (due to potential duplicates)
		const allFacilitiesWithSameName = await prisma.facility.findMany({
			where: { name: facility.name }
		});

		const facilityIds = allFacilitiesWithSameName.map((f) => f.id);
		console.log(
			`Found ${facilityIds.length} facilities with name "${facility.name}"`
		);

		// Check if activity is associated with any facility with the same name
		const facilityActivity = await prisma.facilityActivity.findFirst({
			where: {
				facilityId: { in: facilityIds },
				activityId: activityId
			}
		});

		if (!facilityActivity) {
			return NextResponse.json(
				{ error: 'This activity is not available at the selected facility' },
				{ status: 400 }
			);
		}

		const startTimeDate = new Date(startTime);
		const endTimeDate = addHours(
			startTimeDate,
			Math.ceil(activity.durationMinutes / 60)
		);

		// Find or create a time slot for this reservation
		let timeSlot = await prisma.timeSlot.findFirst({
			where: {
				facilityId: facilityId,
				startTime: {
					gte: new Date(startTimeDate.setMinutes(0, 0, 0)),
					lt: new Date(startTimeDate.setMinutes(59, 59, 999))
				},
				isAvailable: true
			},
			include: {
				reservations: true
			}
		});

		// If time slot not found or not available, return error
		if (!timeSlot) {
			return NextResponse.json(
				{ error: 'No available time slot found for the selected time' },
				{ status: 400 }
			);
		}

		if (timeSlot.reservations.length > 0) {
			return NextResponse.json(
				{ error: 'The selected time slot is already reserved' },
				{ status: 400 }
			);
		}

		// Create the reservation with the authenticated user's ID
		const reservation = await prisma.reservation.create({
			data: {
				userId: session.user.id,
				slotId: timeSlot.id,
				activityId: activityId,
				status: 'confirmed',
				totalPrice: activity.price
			}
		});

		// Mark the time slot as unavailable
		await prisma.timeSlot.update({
			where: { id: timeSlot.id },
			data: { isAvailable: false }
		});

		return NextResponse.json(reservation);
	} catch (error) {
		console.error('Error creating reservation:', error);
		return NextResponse.json(
			{ error: 'Failed to create reservation' },
			{ status: 500 }
		);
	}
}
