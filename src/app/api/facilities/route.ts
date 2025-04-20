import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import from the actual source
import prisma from '@/lib/db'; // Use default import for prisma
import { z } from 'zod';

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
	imageUrl: z.string().url().optional().or(z.literal('')) // camelCase
});

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Přístup odepřen.' }, { status: 403 });
	}

	try {
		const body = await req.json();
		const validation = facilityCreateSchema.safeParse(body);

		if (!validation.success) {
			console.error('Facility validation failed:', validation.error.errors);
			return NextResponse.json(
				{
					message: 'Neplatná data formuláře.',
					errors: validation.error.errors
				},
				{ status: 400 }
			);
		}

		// Keep numbers for validation
		const { name, capacity, status, openingHour, closingHour, imageUrl } =
			validation.data;

		// Check using numbers
		if (openingHour >= closingHour) {
			return NextResponse.json(
				{
					message: 'Otevírací hodina musí být dříve než zavírací hodina.'
				},
				{ status: 400 }
			);
		}

		const newFacility = await prisma.facility.create({
			data: {
				name,
				description: validation.data.description,
				capacity,
				status,
				openingHour,
				closingHour,
				imageUrl: imageUrl || null
			}
		});

		return NextResponse.json(newFacility, { status: 201 });
	} catch (error) {
		console.error('Error creating facility:', error);
		if (error instanceof z.ZodError) {
			// Catch potential JSON parsing errors wrapped by Zod
			return NextResponse.json(
				{ message: 'Neplatný formát požadavku.', errors: error.errors },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ message: 'Interní chyba serveru při vytváření sportoviště.' },
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
			}
			// You might want to include related data later, e.g.:
			// include: { activities: true }
		});

		return NextResponse.json(facilities);
	} catch (error) {
		console.error('Error fetching facilities:', error);
		return NextResponse.json(
			{ message: 'Nepodařilo se načíst sportoviště.' },
			{ status: 500 }
		);
	}
}
