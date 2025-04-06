import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
	try {
		const facilities = await prisma.facility.findMany({
			orderBy: {
				name: 'asc'
			}
		});

		// Remove duplicates by keeping only the first occurrence of each facility name
		const uniqueFacilities = Array.from(
			new Map(facilities.map((item) => [item.name, item])).values()
		);

		return NextResponse.json(uniqueFacilities);
	} catch (error) {
		console.error('Error fetching facilities:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch facilities' },
			{ status: 500 }
		);
	}
}
