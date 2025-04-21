import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Prisma } from '../../../../../generated/prisma';

// Status type definition
type FacilityStatusString = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

// Schema for validation on the server side for updates
const facilityUpdateSchema = z
	.object({
		name: z.string().min(3).optional(),
		description: z.string().optional().nullable(),
		capacity: z.number().int().positive().optional(),
		status: z.enum(['ACTIVE', 'MAINTENANCE', 'CLOSED']).optional(),
		openingHour: z.number().int().min(0).max(23).optional(),
		closingHour: z.number().int().min(0).max(23).optional(),
		imageUrl: z.string().url().optional().nullable(),
		activityIds: z.array(z.string().uuid()).optional()
	})
	.refine(
		(data) => {
			// Validate opening/closing hours only if both are provided
			if (data.openingHour !== undefined && data.closingHour !== undefined) {
				return data.closingHour > data.openingHour;
			}
			return true; // Pass validation if one or both are missing
		},
		{
			message: 'Zavírací hodina musí být pozdější než otevírací hodina.',
			path: ['closingHour']
		}
	);

// GET /api/facilities/{id} - Fetch a single facility with activities
export async function GET(
	request: NextRequest,
	{ params: paramsPromise }: { params: Promise<{ id: string }> }
) {
	const params = await paramsPromise; // Await the promise
	const { id } = params;
	if (!id) {
		return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
	}

	try {
		const facility = await prisma.facility.findUnique({
			where: { id },
			include: {
				activities: {
					// Include associated activity IDs
					select: { activityId: true }
				}
			}
		});

		if (!facility) {
			return NextResponse.json(
				{ error: 'Sportoviště nenalezeno' },
				{ status: 404 }
			);
		}
		return NextResponse.json(facility);
	} catch (error) {
		console.error(`Error fetching facility ${id}:`, error);
		return NextResponse.json(
			{ error: 'Interní chyba serveru' },
			{ status: 500 }
		);
	}
}

// PUT /api/facilities/{id} - Update a facility and its activities
export async function PUT(
	request: NextRequest,
	{ params: paramsPromise }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	const params = await paramsPromise; // Await the promise
	const { id } = params;

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Přístup odepřen.' }, { status: 403 });
	}

	if (!id) {
		return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const validation = facilityUpdateSchema.safeParse(body);

		if (!validation.success) {
			console.error(
				'Facility update validation failed:',
				validation.error.errors
			);
			return NextResponse.json(
				{
					error: 'Neplatná data formuláře.',
					details: validation.error.flatten()
				},
				{ status: 400 }
			);
		}

		const { activityIds, ...facilityData } = validation.data;

		// Check if facility exists before transaction
		const existingFacility = await prisma.facility.findUnique({
			where: { id }
		});
		if (!existingFacility) {
			return NextResponse.json(
				{ error: 'Sportoviště nenalezeno' },
				{ status: 404 }
			);
		}

		// Use Prisma transaction to update facility and activities atomically
		const updatedFacility = await prisma.$transaction(async (tx) => {
			// 1. Update the facility details
			const facilityUpdate = await tx.facility.update({
				where: { id },
				data: {
					...facilityData,
					// Handle potential undefined values for hours
					openingHour: facilityData.openingHour ?? existingFacility.openingHour,
					closingHour: facilityData.closingHour ?? existingFacility.closingHour,
					imageUrl: facilityData.imageUrl // Already handles null
				}
			});

			// 2. Clear existing activity associations for this facility
			await tx.facilityActivity.deleteMany({
				where: { facilityId: id }
			});

			// 3. If activityIds are provided, create new associations
			if (activityIds && activityIds.length > 0) {
				await tx.facilityActivity.createMany({
					data: activityIds.map((actId) => ({
						facilityId: id,
						activityId: actId
					})),
					skipDuplicates: true
				});
			}

			return facilityUpdate; // Return the updated facility data
		});

		return NextResponse.json(updatedFacility);
	} catch (error) {
		console.error(`Error updating facility ${id}:`, error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return NextResponse.json(
					{ error: 'Sportoviště s tímto názvem již může existovat.' },
					{ status: 409 }
				);
			}
			if (error.code === 'P2025') {
				return NextResponse.json(
					{ error: 'Sportoviště nenalezeno' },
					{ status: 404 }
				);
			}
		}
		return NextResponse.json(
			{ error: 'Interní chyba serveru při aktualizaci sportoviště.' },
			{ status: 500 }
		);
	}
}

// DELETE /api/facilities/{id} - Delete a facility (consider soft delete)
export async function DELETE(
	request: NextRequest,
	{ params: paramsPromise }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	const params = await paramsPromise; // Await the promise
	const { id } = params;

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Přístup odepřen.' }, { status: 403 });
	}

	if (!id) {
		return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
	}

	try {
		// Check if facility exists before deleting
		const existingFacility = await prisma.facility.findUnique({
			where: { id }
		});
		if (!existingFacility) {
			return NextResponse.json(
				{ error: 'Sportoviště nenalezeno' },
				{ status: 404 }
			);
		}

		// Perform deletion (cascades should handle related FacilityActivity, TimeSlot, etc. based on schema)
		await prisma.facility.delete({ where: { id } });

		/* 
		// --- Alternative: Soft Delete (Mark as inactive/closed) ---
		await prisma.facility.update({
			where: { id },
			data: { 
				status: 'CLOSED', // Or add an isDeleted flag
				// Consider implications: Should associated activities be removed? Time slots? Reservations?
			}
		});
		*/

		return NextResponse.json(
			{ message: 'Sportoviště bylo úspěšně smazáno.' },
			{ status: 200 }
		);
	} catch (error) {
		console.error(`Error deleting facility ${id}:`, error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2025') {
				// Record to delete not found
				return NextResponse.json(
					{ error: 'Sportoviště nenalezeno' },
					{ status: 404 }
				);
			}
			// Handle other potential errors, like foreign key constraints if cascade isn't set up correctly
		}
		return NextResponse.json(
			{ error: 'Interní chyba serveru při mazání sportoviště.' },
			{ status: 500 }
		);
	}
}
