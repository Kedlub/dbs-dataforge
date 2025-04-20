import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
	try {
		// TODO: Add authentication check to ensure only admins can access

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
