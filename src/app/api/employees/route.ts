import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
	const user = await getCurrentUser();

	if (!user || user.role?.name !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const employees = await prisma.user.findMany({
			where: {
				role: {
					name: 'EMPLOYEE'
				},
				isActive: true
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true
			},
			orderBy: [
				{
					lastName: 'asc'
				},
				{
					firstName: 'asc'
				}
			]
		});
		return NextResponse.json(employees);
	} catch (error) {
		console.error('Failed to fetch employees:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch employees' },
			{ status: 500 }
		);
	}
}
