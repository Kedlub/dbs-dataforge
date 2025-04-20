import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { UserEditSchema } from '@/lib/types'; // Import the Zod schema
import { z } from 'zod';

interface Params {
	params: { userId: string };
}

export async function PATCH(req: Request, { params }: Params) {
	try {
		await requireAuth('ADMIN');

		const { userId } = params;
		if (!userId) {
			return new NextResponse('Missing User ID', { status: 400 });
		}

		const body = await req.json();
		const validationResult = UserEditSchema.safeParse(body);

		if (!validationResult.success) {
			return new NextResponse(
				JSON.stringify({
					errors: validationResult.error.flatten().fieldErrors
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Prepare data for Prisma, conditionally including the phone field
		const dataToUpdate = {
			...validationResult.data,
			...(validationResult.data.phone !== undefined && { phone: validationResult.data.phone })
		};

		// Check if there's actually any data to update after validation
		// Since all fields are optional, the body could be valid but empty
		if (Object.keys(dataToUpdate).length === 0) {
			return new NextResponse('No update fields provided', { status: 400 });
		}

		const updatedUser = await db.user.update({
			where: { id: userId },
			data: dataToUpdate, // Pass the validated and mapped data
			include: {
				role: true
			}
		});

		// Exclude password hash from the response
		const { passwordHash: _, ...userWithoutPassword } = updatedUser;

		return NextResponse.json(userWithoutPassword);
	} catch (error: any) {
		console.error('[API_USERS_USERID_PATCH]', error);

		// Check for Prisma P2025 error (Record not found)
		if (error?.code === 'P2025') {
			return new NextResponse('User not found', { status: 404 });
		}

		// Handle Zod errors separately if they slip through (shouldn't normally)
		if (error instanceof z.ZodError) {
			return new NextResponse(JSON.stringify({ errors: error.flatten() }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Generic internal error for anything else
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: Params) {
	try {
		await requireAuth('ADMIN');

		const { userId } = params;

		if (!userId) {
			return new NextResponse('User ID missing', { status: 400 });
		}

		// Check if user exists before attempting deactivation
		// Catch potential P2025 error here too
		const userExists = await db.user
			.findUnique({
				where: { id: userId },
				select: { id: true }
			})
			.catch((err) => {
				if (err?.code === 'P2025') return null; // Treat not found as null
				throw err; // Re-throw other errors
			});

		if (!userExists) {
			return new NextResponse('User not found', { status: 404 });
		}

		const result = await db.$executeRawUnsafe(
			'CALL deactivate_user($1::TEXT);',
			userId
		);

		if (result >= 0) {
			return new NextResponse(null, { status: 204 });
		} else {
			console.error(
				'[API_USERS_USERID_DELETE] Procedure call failed unexpectedly',
				result
			);
			return new NextResponse('Deactivation failed', { status: 500 });
		}
	} catch (error: any) {
		console.error('[API_USERS_USERID_DELETE]', error);

		// Simple check for Prisma error codes if available
		if (error?.code) {
			return new NextResponse(`Database error: ${error.code}`, {
				status: 400
			});
		}

		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
