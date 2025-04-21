import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth'; // Assuming requireAuth can check roles

const searchSchema = z.object({
	query: z.string().min(2, 'Search query must be at least 2 characters long')
});

export async function GET(request: NextRequest) {
	try {
		// Ensure only authenticated employees or admins can search
		await requireAuth(['ADMIN', 'EMPLOYEE']);

		const { searchParams } = new URL(request.url);
		const query = searchParams.get('query');

		const validation = searchSchema.safeParse({ query });

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const searchTerm = validation.data.query;

		const users = await prisma.user.findMany({
			where: {
				OR: [
					{ firstName: { contains: searchTerm, mode: 'insensitive' } },
					{ lastName: { contains: searchTerm, mode: 'insensitive' } },
					{ email: { contains: searchTerm, mode: 'insensitive' } },
					{ phone: { contains: searchTerm, mode: 'insensitive' } }
				],
				isActive: true // Optionally filter only active users
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true
			},
			take: 10 // Limit results
		});

		return NextResponse.json(users);
	} catch (error: any) {
		console.error('Error searching users:', error);
		// Handle specific auth errors if requireAuth throws them
		// Or provide a generic error
		if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
			return NextResponse.json({ error: error.message }, { status: 401 });
		}
		return NextResponse.json(
			{ error: 'Failed to search users' },
			{ status: 500 }
		);
	}
}
