import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Reuse the schema from the form component, but make fields optional for PATCH
const facilityPatchSchema = z.object({
	name: z.string().min(3).optional(),
	description: z.string().optional().nullable(),
	capacity: z.coerce.number().int().positive().optional(),
	status: z.enum(['ACTIVE', 'MAINTENANCE', 'CLOSED']).optional(),
	openingHour: z.coerce.number().int().min(0).max(23).optional(),
	closingHour: z.coerce.number().int().min(0).max(23).optional(),
	imageUrl: z.string().url().optional().nullable().or(z.literal(''))
});

// Define a schema that includes the closingHour refinement
const facilityUpdateSchema = facilityPatchSchema.partial().refine(
	(data) => {
		// If both hours are provided, closing must be after opening
		if (data.openingHour !== undefined && data.closingHour !== undefined) {
			return data.closingHour > data.openingHour;
		}
		return true; // Validation passes if only one or neither is provided
	},
	{
		message:
			'Zavírací hodina musí být pozdější než otevírací hodina, pokud jsou obě zadány.',
		path: ['closingHour']
	}
);

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;

		const facility = await prisma.facility.findUnique({
			where: {
				id: id
			}
		});

		if (!facility) {
			return NextResponse.json(
				{ message: 'Sportoviště nebylo nalezeno' },
				{ status: 404 }
			);
		}

		return NextResponse.json(facility);
	} catch (error) {
		console.error('Error fetching facility:', error);
		return NextResponse.json(
			{ message: 'Interní chyba serveru' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (session?.user?.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });
	}

	try {
		const id = (await params).id;
		const body = await req.json();

		// Find the existing facility to validate opening/closing hours correctly
		const existingFacility = await prisma.facility.findUnique({
			where: { id },
			select: { openingHour: true, closingHour: true }
		});

		if (!existingFacility) {
			return NextResponse.json(
				{ message: 'Sportoviště pro aktualizaci nebylo nalezeno' },
				{ status: 404 }
			);
		}

		// Validate the incoming data along with existing data for time check
		const validationData = {
			...existingFacility, // Use existing hours as base
			...body // Override with new hours if provided
		};
		// Just validate, don't need the result if it passes
		facilityUpdateSchema.parse(validationData);

		// We need to parse the body separately with the looser patch schema
		// to know exactly which fields were sent by the client for update.
		const bodyParsed = facilityPatchSchema.parse(body);

		// Filter out undefined values from the *original body* before updating
		const dataToUpdate: Record<string, any> = Object.fromEntries(
			Object.entries(bodyParsed).filter(([_, v]) => v !== undefined)
		);

		// Handle imageUrl specifically: map empty string from form to null for DB
		if ('imageUrl' in dataToUpdate) {
			// Check existence before accessing
			if (dataToUpdate.imageUrl === '') {
				dataToUpdate.imageUrl = null;
			}
		} else {
			// If imageUrl was not in the body, explicitly remove potential undefined value
			delete dataToUpdate.imageUrl;
		}



		const updatedFacilitySelect = await prisma.facility.findMany({
			where: { id }
		});
		// Wrap update in transaction to set user context for the trigger
		const updatedFacility = await prisma.$transaction(async (tx) => {
			// Set the session variable for the current transaction
			// The 'true' argument makes the setting local to the transaction
			await tx.$executeRaw`SELECT set_config('app.current_user_id', ${session!.user.id}, true)`;

			// Perform the update
			const facility = await tx.facility.update({
				where: { id },
				data: dataToUpdate
			});

			// Optionally, you could clear the setting, but it's transaction-local anyway
			// await tx.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;

			return facility;
		});

		console.log([updatedFacility]); // Log the result (contains only the updated facility)

		return NextResponse.json(updatedFacility);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ message: 'Neplatná data', errors: error.errors },
				{ status: 400 }
			);
		}
		console.error('Error updating facility:', error);
		return NextResponse.json(
			{ message: 'Interní chyba serveru při aktualizaci sportoviště' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (session?.user?.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Přístup odepřen' }, { status: 403 });
	}

	try {
		const id = (await params).id;

		// Optional: Check if facility exists before attempting delete
		const existingFacility = await prisma.facility.findUnique({
			where: { id }
		});

		if (!existingFacility) {
			return NextResponse.json(
				{ message: 'Sportoviště pro smazání nebylo nalezeno' },
				{ status: 404 }
			);
		}

		// Note: Depending on your schema constraints, you might need to handle
		// related records (e.g., reservations, time slots) before deleting.
		// Prisma's default behavior might prevent deletion if related records exist.
		// Add cascading deletes in your Prisma schema or handle cleanup manually here.
		await prisma.facility.delete({
			where: {
				id: id
			}
		});

		return NextResponse.json(
			{ message: 'Sportoviště úspěšně smazáno' },
			{ status: 200 }
		);
	} catch (error: any) {
		console.error('Error deleting facility:', error);

		// Handle potential Prisma errors, e.g., foreign key constraint violation
		if (error.code === 'P2003') {
			// Prisma code for foreign key constraint failure
			return NextResponse.json(
				{
					message:
						'Nelze smazat sportoviště, protože má existující rezervace nebo časové sloty.'
				},
				{ status: 409 } // Conflict
			);
		}

		return NextResponse.json(
			{ message: 'Interní chyba serveru při mazání sportoviště' },
			{ status: 500 }
		);
	}
}
