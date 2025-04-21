import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { Prisma } from '../../../../generated/prisma'; // Adjust path as needed

// Zod schema for validating the activity data
const activitySchema = z.object({
	name: z.string().min(1, 'Název je povinný'),
	description: z.string().optional(),
	durationMinutes: z
		.number()
		.int()
		.positive('Doba trvání musí být kladné číslo'),
	price: z
		.number()
		.nonnegative('Cena nesmí být záporná')
		.transform((val) => new Prisma.Decimal(val)), // Convert to Decimal for Prisma
	maxParticipants: z
		.number()
		.int()
		.positive('Maximální počet účastníků musí být kladné číslo'),
	isActive: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const facilityId = searchParams.get('facilityId');

		// If facilityId is provided, get activities for that specific facility
		if (facilityId) {
			console.log(`Searching for activities for facilityId: ${facilityId}`);

			const facilityActivities = await prisma.facilityActivity.findMany({
				where: {
					facilityId: facilityId,
					activity: { isActive: true } // Only include active activities
				},
				include: {
					activity: true // Include the full activity details
				},
				orderBy: {
					activity: { name: 'asc' } // Order by activity name
				}
			});

			// Map the result to only return the activity objects
			const activities = facilityActivities.map((fa) => fa.activity);

			console.log(
				`Returning ${activities.length} activities for facility ${facilityId}`
			);
			return NextResponse.json(activities);
		}

		// Otherwise, get all active activities
		console.log('Fetching all active activities');
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

export async function POST(request: NextRequest) {
	const session = await getAuthSession();

	// Only allow admins to create activities
	if (session?.user?.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const validation = activitySchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input data', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const newActivity = await prisma.activity.create({
			data: validation.data
		});

		return NextResponse.json(newActivity, { status: 201 });
	} catch (error) {
		console.error('Error creating activity:', error);
		// Handle potential Prisma unique constraint errors, etc.
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				// Unique constraint violation - adjust based on your actual unique fields if any
				return NextResponse.json(
					{ error: 'Activity with this name might already exist' },
					{ status: 409 }
				);
			}
		}
		return NextResponse.json(
			{ error: 'Failed to create activity' },
			{ status: 500 }
		);
	}
}
