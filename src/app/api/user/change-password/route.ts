import { NextRequest, NextResponse } from 'next/server';
import { hash, compare } from 'bcrypt';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const { currentPassword, newPassword } = data;

		// Validate input
		if (!currentPassword || !newPassword) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Verify current password
		const isPasswordValid = await compare(
			currentPassword,
			currentUser.passwordHash
		);

		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: 'Current password is incorrect' },
				{ status: 400 }
			);
		}

		// Hash new password
		const newPasswordHash = await hash(newPassword, SALT_ROUNDS);

		// Update user password
		await prisma.user.update({
			where: { id: currentUser.id },
			data: {
				passwordHash: newPasswordHash
			}
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error changing password:', error);
		return NextResponse.json(
			{ error: 'Failed to change password' },
			{ status: 500 }
		);
	}
}
