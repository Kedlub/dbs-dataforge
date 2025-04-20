import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import dayjs from 'dayjs';
import { Prisma } from '../../../../../generated/prisma';

// Define the expected structure of the raw query result
interface AvailabilitySummaryResult {
	get_facility_availability_summary: string;
}

// Define the type for the active facility data we select
type ActiveFacility = Pick<
	Prisma.FacilityGetPayload<{ select: { id: true; name: true } }>,
	'id' | 'name'
>;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const dateParam = searchParams.get('date');

	// Validate or default the date
	const checkDate =
		dateParam && dayjs(dateParam).isValid()
			? dayjs(dateParam).format('YYYY-MM-DD')
			: dayjs().format('YYYY-MM-DD'); // Default to today

	try {
		// Fetch active facilities
		const activeFacilities = await prisma.facility.findMany({
			where: {
				status: {
					mode: 'insensitive',
					equals: 'active'
				}
			},
			select: {
				id: true,
				name: true
			}
		});

		if (activeFacilities.length === 0) {
			return NextResponse.json([]);
		}

		// Fetch availability summary for each active facility
		const availabilityData = await Promise.all(
			activeFacilities.map(async (facility: ActiveFacility) => {
				try {
					// Use $queryRawUnsafe for diagnostics, ensuring proper quoting and casting
					const sql = `SELECT get_facility_availability_summary('${facility.id}'::TEXT, '${checkDate}'::date) AS get_facility_availability_summary`;
					const result =
						await prisma.$queryRawUnsafe<AvailabilitySummaryResult[]>(sql);

					const summary = result[0]?.get_facility_availability_summary ?? 'N/A';

					return {
						facilityId: facility.id,
						facilityName: facility.name,
						summary: summary
					};
				} catch (dbError) {
					console.error(
						`Error fetching availability for facility ${facility.id} on ${checkDate}:`,
						dbError
					);
					// Return placeholder data on error for this specific facility
					return {
						facilityId: facility.id,
						facilityName: facility.name,
						summary: 'Chyba při načítání dostupnosti'
					};
				}
			})
		);

		return NextResponse.json(availabilityData);
	} catch (error) {
		console.error('Failed to fetch facility availability:', error);
		return NextResponse.json(
			{ error: 'Nepodařilo se načíst dostupnost sportovišť' },
			{ status: 500 }
		);
	}
}
