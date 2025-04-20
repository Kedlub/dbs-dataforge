import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// TODO: Add authentication and authorization checks (admin only)

interface Params {
	params: { userId: string };
}

export async function PATCH(req: Request, { params }: Params) {
	try {
		// Ensure only admins can access this route
		await requireAuth('ADMIN');

		const { userId } = params;
		const body = await req.json();
		const {
			roleId,
			isActive
			// Add other updatable fields here if needed (e.g., firstName, lastName)
			// Ensure password updates are handled separately and securely if implemented
		} = body;

		if (!userId) {
			return new NextResponse('User ID missing', { status: 400 });
		}

		// Construct update data conditionally
		const updateData: { roleId?: string; isActive?: boolean } = {};
		if (roleId !== undefined) {
			updateData.roleId = roleId;
		}
		if (isActive !== undefined) {
			updateData.isActive = isActive;
		}

		if (Object.keys(updateData).length === 0) {
			return new NextResponse('No update fields provided', { status: 400 });
		}

		const updatedUser = await db.user.update({
			where: { id: userId },
			data: updateData,
			include: {
				role: true
			}
		});

		// Exclude password hash from the response
		const { passwordHash: _, ...userWithoutPassword } = updatedUser;

		return NextResponse.json(userWithoutPassword);
	} catch (error) {
		console.error('[API_USERS_USERID_PATCH]', error);
		if (
			error instanceof Error &&
			'code' in error &&
			(error as any).code === 'P2025'
		) {
			return new NextResponse('User not found', { status: 404 });
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: Params) {
	try {
		// Ensure only admins can access this route
		await requireAuth('ADMIN');

		const { userId } = params;

		if (!userId) {
			return new NextResponse('User ID missing', { status: 400 });
		}

		// Check if user exists before attempting deactivation
		const userExists = await db.user.findUnique({
			where: { id: userId },
			select: { id: true }
		});

		if (!userExists) {
			return new NextResponse('User not found', { status: 404 });
		}

		// Call the stored procedure to deactivate the user
		// NOTE: Using executeRawUnsafe as procedure arguments might not be type-safe with executeRaw
		const result = await db.$executeRawUnsafe(
			'CALL deactivate_user($1::UUID);',
			userId
		);

		// executeRaw/Unsafe returns the number of rows affected by the query (or procedure in this case)
		// We expect it to affect the user table, potentially reservations via trigger.
		// A result >= 0 typically indicates success (even if 0 rows directly affected by CALL)
		if (result >= 0) {
			return new NextResponse(null, { status: 204 }); // No Content on success
		} else {
			// This case might indicate an issue within the procedure or DB execution
			console.error(
				'[API_USERS_USERID_DELETE] Procedure call failed unexpectedly',
				result
			);
			return new NextResponse('Deactivation failed', { status: 500 });
		}
	} catch (error) {
		console.error('[API_USERS_USERID_DELETE]', error);
		// Handle potential errors, e.g., if the procedure fails
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
