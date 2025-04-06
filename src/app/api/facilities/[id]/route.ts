import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id;

		const facility = await prisma.facility.findUnique({
			where: {
				id: id
			}
		});

		if (!facility) {
			return NextResponse.json(
				{ error: 'Facility not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(facility);
	} catch (error) {
		console.error('Error fetching facility:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch facility' },
			{ status: 500 }
		);
	}
}
