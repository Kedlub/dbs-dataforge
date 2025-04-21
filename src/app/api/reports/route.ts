import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
	try {
		const session = await getAuthSession();

		if (!session?.user || session.user.role !== 'ADMIN') {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		// TODO: Add pagination and filtering later if needed
		const reports = await prisma.report.findMany({
			orderBy: {
				generatedAt: 'desc'
			},
			include: {
				user: {
					select: {
						firstName: true,
						lastName: true
					}
				}
			}
		});

		return NextResponse.json(reports);
	} catch (error) {
		console.error('[REPORTS_GET]', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
