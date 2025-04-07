import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const { firstName, lastName, email, phone } = data;

		// Validate input
		if (!firstName || !lastName || !email) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Check if email is already taken by another user
		if (email !== currentUser.email) {
			const existingUser = await prisma.user.findUnique({
				where: { email }
			});

			if (existingUser) {
				return NextResponse.json(
					{ error: 'Email is already in use' },
					{ status: 400 }
				);
			}
		}

		// Update user
		const updatedUser = await prisma.user.update({
			where: { id: currentUser.id },
			data: {
				firstName,
				lastName,
				email,
				phone
			},
			select: {
				id: true,
				username: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true
			}
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error('Error updating user:', error);
		return NextResponse.json(
			{ error: 'Failed to update user' },
			{ status: 500 }
		);
	}
}
