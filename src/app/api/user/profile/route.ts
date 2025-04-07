import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			// Return a specific status code for session expiration or missing user
			return NextResponse.json(
				{ error: 'Unauthorized', code: 'SESSION_EXPIRED' },
				{ status: 401 }
			);
		}

		// Return user data (excluding sensitive fields like passwordHash)
		return NextResponse.json({
			id: currentUser.id,
			username: currentUser.username,
			firstName: currentUser.firstName,
			lastName: currentUser.lastName,
			email: currentUser.email,
			phone: currentUser.phone,
			registrationDate: currentUser.registrationDate,
			isActive: currentUser.isActive,
			role: {
				id: currentUser.role.id,
				name: currentUser.role.name
			}
		});
	} catch (error) {
		console.error('Error retrieving user profile:', error);
		return NextResponse.json(
			{ error: 'Failed to retrieve user profile' },
			{ status: 500 }
		);
	}
}
