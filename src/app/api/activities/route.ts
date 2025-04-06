import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const facilityId = searchParams.get('facilityId');

		// If facilityId is provided, get activities for that facility
		if (facilityId) {
			const facilityActivities = await prisma.facilityActivity.findMany({
				where: {
					facilityId: facilityId
				},
				include: {
					activity: true
				}
			});

			// Extract the activities from the facility-activity relation
			const activities = facilityActivities.map((fa) => fa.activity);

			return NextResponse.json(activities);
		}

		// Otherwise, get all activities
		const activities = await prisma.activity.findMany({
			where: {
				isActive: true
			},
			orderBy: {
				name: 'asc'
			}
		});

		return NextResponse.json(activities);
	} catch (error) {
		console.error('Error fetching activities:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch activities' },
			{ status: 500 }
		);
	}
}
