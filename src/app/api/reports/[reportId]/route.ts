import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

interface RouteParams {
	params: {
		reportId: string;
	};
}

export async function GET(request: Request, { params }: RouteParams) {
	const { reportId } = params;

	if (!reportId) {
		return new NextResponse('Report ID missing', { status: 400 });
	}

	try {
		const session = await getAuthSession();

		if (!session?.user || session.user.role !== 'ADMIN') {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const report = await prisma.report.findUnique({
			where: {
				id: reportId
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

		if (!report) {
			return new NextResponse('Report not found', { status: 404 });
		}

		// The reportData is already JSON, so we can return it directly.
		return NextResponse.json(report);
	} catch (error) {
		console.error('[REPORT_GET_BY_ID]', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
