import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
	try {
		// Ensure only admins can access this route
		await requireAuth('ADMIN');

		const roles = await db.role.findMany({
			orderBy: {
				createdAt: 'asc'
			}
		});

		return NextResponse.json(roles);
	} catch (error) {
		console.error('[API_ROLES_GET]', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
