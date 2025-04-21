import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { Prisma } from '../../../../../generated/prisma'; // Adjust path as needed

// Zod schema for validating the activity data for updates (similar to POST, but fields are optional)
const activityUpdateSchema = z.object({
	name: z.string().min(1, 'Název je povinný').optional(),
	description: z.string().optional().nullable(), // Allow null to clear description
	durationMinutes: z
		.number()
		.int()
		.positive('Doba trvání musí být kladné číslo')
		.optional(),
	price: z
		.number()
		.nonnegative('Cena nesmí být záporná')
		.transform((val) => new Prisma.Decimal(val)) // Convert to Decimal for Prisma
		.optional(),
	maxParticipants: z
		.number()
		.int()
		.positive('Maximální počet účastníků musí být kladné číslo')
		.optional(),
	isActive: z.boolean().optional()
});

// GET /api/activities/{id} - Fetch a single activity
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	if (!id || typeof id !== 'string') {
		return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		const activity = await prisma.activity.findUnique({
			where: { id }
		});

		if (!activity) {
			return NextResponse.json(
				{ error: 'Activity not found' },
				{ status: 404 }
			);
		}

		// Convert Decimal price back to number for JSON response
		const activityResponse = {
			...activity,
			price: Number(activity.price) // Ensure price is number
		};

		return NextResponse.json(activityResponse);
	} catch (error) {
		console.error(`Error fetching activity ${id}:`, error);
		return NextResponse.json(
			{ error: 'Failed to fetch activity' },
			{ status: 500 }
		);
	}
}

// PUT /api/activities/{id} - Update an activity
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getAuthSession();
	const { id } = await params;

	// Only allow admins to update activities
	if (session?.user?.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	}

	if (!id || typeof id !== 'string') {
		return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const validation = activityUpdateSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input data', details: validation.error.errors },
				{ status: 400 }
			);
		}

		// Check if activity exists before updating
		const existingActivity = await prisma.activity.findUnique({
			where: { id }
		});

		if (!existingActivity) {
			return NextResponse.json(
				{ error: 'Activity not found' },
				{ status: 404 }
			);
		}

		const updatedActivity = await prisma.activity.update({
			where: { id },
			data: validation.data
		});

		// Convert Decimal price back to number for JSON response
		const activityResponse = {
			...updatedActivity,
			price: Number(updatedActivity.price) // Ensure price is number
		};

		return NextResponse.json(activityResponse);
	} catch (error) {
		console.error(`Error updating activity ${id}:`, error);
		// Handle potential Prisma unique constraint errors if name is unique
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return NextResponse.json(
					{ error: 'Activity with this name might already exist' },
					{ status: 409 }
				);
			}
			if (error.code === 'P2025') {
				// Record to update not found
				return NextResponse.json(
					{ error: 'Activity not found' },
					{ status: 404 }
				);
			}
		}
		return NextResponse.json(
			{ error: 'Failed to update activity' },
			{ status: 500 }
		);
	}
}

// DELETE /api/activities/{id} - Mark an activity as inactive
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getAuthSession();
	const { id } = await params;

	// Only allow admins to delete (deactivate) activities
	if (session?.user?.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	}

	if (!id || typeof id !== 'string') {
		return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		// Check if activity exists before deactivating
		const existingActivity = await prisma.activity.findUnique({
			where: { id }
		});

		if (!existingActivity) {
			return NextResponse.json(
				{ error: 'Activity not found' },
				{ status: 404 }
			);
		}

		// Update the activity to set isActive to false
		await prisma.activity.update({
			where: { id },
			data: { isActive: false }
		});

		return NextResponse.json(
			{ message: 'Activity deactivated successfully' },
			{ status: 200 }
		);
	} catch (error) {
		console.error(`Error deactivating activity ${id}:`, error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2025') {
				// Record to update not found
				return NextResponse.json(
					{ error: 'Activity not found' },
					{ status: 404 }
				);
			}
		}
		return NextResponse.json(
			{ error: 'Failed to deactivate activity' },
			{ status: 500 }
		);
	}
}
