import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Import from the new location
import prisma from '@/lib/db'; // Use default import for prisma
import { z } from 'zod';
import { Prisma } from '../../../../generated/prisma'; // Import Prisma types

// Assuming status is stored as string in DB
type FacilityStatusString = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

// Schema for validation on the server side
// (Optional description field commented out, matching the frontend)
const facilityCreateSchema = z.object({
	name: z.string().min(3),
	description: z.string().optional(),
	capacity: z.number().int().positive(),
	status: z.enum([
		'ACTIVE',
		'MAINTENANCE',
		'CLOSED'
	]) satisfies z.ZodType<FacilityStatusString>,
	openingHour: z.number().int().min(0).max(23), // Expect hour as integer 0-23
	closingHour: z.number().int().min(0).max(23), // Expect hour as integer 0-23
	imageUrl: z.string().url().optional().nullable(), // Allow null
	activityIds: z.array(z.string().uuid()).optional() // Expect activityIds
});

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Přístup odepřen.' }, { status: 403 });
	}

	try {
		const body = await req.json();
		const validation = facilityCreateSchema.safeParse(body);

		if (!validation.success) {
			console.error('Facility validation failed:', validation.error.errors);
			return NextResponse.json(
				{
					error: 'Neplatná data formuláře.',
					details: validation.error.flatten()
				},
				{ status: 400 }
			);
		}

		const { openingHour, closingHour, activityIds, ...facilityData } =
			validation.data;

		if (openingHour >= closingHour) {
			return NextResponse.json(
				{ error: 'Otevírací hodina musí být dříve než zavírací hodina.' },
				{ status: 400 }
			);
		}

		// Use Prisma transaction
		const newFacility = await prisma.$transaction(async (tx) => {
			// 1. Create the facility
			const createdFacility = await tx.facility.create({
				data: {
					...facilityData,
					openingHour,
					closingHour,
					imageUrl: facilityData.imageUrl || null // Ensure null if empty string came
				}
			});

			// 2. If activityIds are provided, create associations
			if (activityIds && activityIds.length > 0) {
				await tx.facilityActivity.createMany({
					data: activityIds.map((actId) => ({
						facilityId: createdFacility.id,
						activityId: actId
					})),
					skipDuplicates: true // In case of any potential race condition/duplicates
				});
			}

			return createdFacility;
		});

		return NextResponse.json(newFacility, { status: 201 });
	} catch (error) {
		console.error('Error creating facility:', error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			// Handle specific Prisma errors if needed (e.g., unique constraints)
			if (error.code === 'P2002') {
				return NextResponse.json(
					{ error: 'Sportoviště s tímto názvem již může existovat.' },
					{ status: 409 }
				);
			}
		}
		return NextResponse.json(
			{ error: 'Interní chyba serveru při vytváření sportoviště.' },
			{ status: 500 }
		);
	}
}

// GET handler to fetch all facilities
export async function GET(req: Request) {
	try {
		const facilities = await prisma.facility.findMany({
			orderBy: {
				name: 'asc' // Optional: Order by name
			},
			// Include associated activities
			include: {
				activities: {
					select: { activityId: true } // Only select the ID
				}
			}
		});

		return NextResponse.json(facilities);
	} catch (error) {
		console.error('Error fetching facilities:', error);
		return NextResponse.json(
			{ error: 'Nepodařilo se načíst sportoviště.' }, // Changed message to error
			{ status: 500 }
		);
	}
}
