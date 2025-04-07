import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const facilityId = searchParams.get('facilityId');

		// If facilityId is provided, get activities for that facility
		if (facilityId) {
			console.log(`Searching for activities with facilityId: ${facilityId}`);

			// First, find the facility to get its name
			const facility = await prisma.facility.findUnique({
				where: { id: facilityId }
			});

			if (!facility) {
				console.log(`No facility found with ID: ${facilityId}`);
				return NextResponse.json([]);
			}

			console.log(`Found facility: ${facility.name} (${facility.id})`);

			// Find all facilities with the same name (due to potential duplicates)
			const allFacilitiesWithSameName = await prisma.facility.findMany({
				where: { name: facility.name }
			});

			const facilityIds = allFacilitiesWithSameName.map((f) => f.id);
			console.log(
				`Found ${facilityIds.length} facilities with name "${facility.name}"`
			);

			// Find facility-activity relations for all of these facilities
			const facilityActivities = await prisma.facilityActivity.findMany({
				where: {
					facilityId: { in: facilityIds }
				},
				include: {
					activity: true
				}
			});

			console.log(
				`Found ${facilityActivities.length} facility-activity relations`
			);

			// Extract unique activities (in case of duplicates)
			const activityMap = new Map();
			facilityActivities.forEach((fa) => {
				activityMap.set(fa.activity.id, fa.activity);
			});

			const activities = Array.from(activityMap.values());
			console.log(`Returning ${activities.length} unique activities`);

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
