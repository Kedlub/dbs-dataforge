import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { z } from 'zod';
// Assuming tsconfig paths alias @/generated/* to ./generated/*
import { Prisma } from '@/../generated/prisma'; // Corrected import path

// Define schema for request body validation
const reportGenerationSchema = z.object({
	reportType: z.enum(['USAGE', 'FINANCIAL', 'CUSTOM']), // Add other types as needed
	title: z.string().min(1, 'Název reportu je povinný.'),
	description: z.string().optional(),
	startDate: z
		.string()
		.datetime({ message: 'Neplatný formát počátečního data.' }), // ISO 8601 format
	endDate: z.string().datetime({ message: 'Neplatný formát koncového data.' }) // ISO 8601 format
	// Add other specific parameters if needed, e.g., facilityId
});

// Type for revenue calculation result per facility
interface FacilityRevenueResult {
	name: string;
	revenue: number;
	error?: string; // Optional error message
}

export async function POST(request: Request) {
	try {
		const session = await getAuthSession();

		if (!session?.user || session.user.role !== 'ADMIN') {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const body = await request.json();
		const validation = reportGenerationSchema.safeParse(body);

		if (!validation.success) {
			return new NextResponse(JSON.stringify(validation.error.format()), {
				status: 400
			});
		}

		const { reportType, title, description, startDate, endDate } =
			validation.data;

		let reportData: any = {}; // Placeholder for actual report data

		// Format dates correctly for SQL (YYYY-MM-DD) / Prisma queries (ISO String or Date object)
		const sqlStartDate = startDate.substring(0, 10);
		const sqlEndDate = endDate.substring(0, 10);
		const isoStartDate = new Date(startDate);
		const isoEndDate = new Date(endDate);

		// --- Report Generation Logic --- //
		if (reportType === 'USAGE') {
			console.log(
				`Generating Usage Report for ${isoStartDate.toISOString()} to ${isoEndDate.toISOString()}`
			);

			// Fetch confirmed reservations within the date range
			// Including related data needed for aggregation
			const reservations = await prisma.reservation.findMany({
				where: {
					status: 'confirmed',
					timeSlot: {
						startTime: {
							gte: isoStartDate
						},
						endTime: {
							lte: isoEndDate
						}
					}
				},
				include: {
					activity: {
						select: { id: true, name: true }
					},
					timeSlot: {
						include: {
							facility: {
								select: { id: true, name: true }
							}
						}
					}
				}
			});

			// Aggregate data
			const totalReservations = reservations.length;
			const reservationsByFacility: {
				[key: string]: { name: string; count: number };
			} = {};
			const reservationsByActivity: {
				[key: string]: { name: string; count: number };
			} = {};

			for (const res of reservations) {
				// By Facility
				const facility = res.timeSlot.facility;
				if (facility) {
					if (!reservationsByFacility[facility.id]) {
						reservationsByFacility[facility.id] = {
							name: facility.name,
							count: 0
						};
					}
					reservationsByFacility[facility.id].count++;
				}

				// By Activity
				const activity = res.activity;
				if (activity) {
					if (!reservationsByActivity[activity.id]) {
						reservationsByActivity[activity.id] = {
							name: activity.name,
							count: 0
						};
					}
					reservationsByActivity[activity.id].count++;
				}
			}

			reportData = {
				startDate: isoStartDate.toISOString(),
				endDate: isoEndDate.toISOString(),
				totalReservations,
				reservationsByFacility,
				reservationsByActivity
			};
			console.log('Usage Report Data:', reportData);
		} else if (reportType === 'FINANCIAL') {
			console.log(
				`Generating Financial Report for ${sqlStartDate} to ${sqlEndDate}`
			);
			const facilities = await prisma.facility.findMany({
				select: { id: true, name: true }
			});

			let totalRevenue = 0;
			const revenueByFacility: { [key: string]: FacilityRevenueResult } = {};

			for (const facility of facilities) {
				try {
					const result = await prisma.$queryRaw<
						[{ calculate_facility_revenue: number | null }]
					>`SELECT calculate_facility_revenue(${facility.id}::TEXT, ${sqlStartDate}::DATE, ${sqlEndDate}::DATE)`;

					const facilityRevenue = result[0]?.calculate_facility_revenue ?? 0;
					revenueByFacility[facility.id] = {
						name: facility.name,
						revenue: facilityRevenue
					};
					totalRevenue += facilityRevenue;
				} catch (dbError) {
					console.error(
						`Error calculating revenue for facility ${facility.id}:`,
						dbError
					);
					revenueByFacility[facility.id] = {
						name: facility.name,
						revenue: 0,
						error: 'Database query failed'
					};
				}
			}

			reportData = {
				startDate: sqlStartDate,
				endDate: sqlEndDate,
				totalRevenue,
				revenueByFacility
			};
			console.log('Financial Report Data:', reportData);
		} else {
			// Handle other or custom report types
			reportData = { message: 'Custom report generation pending.' };
		}

		// --- Save Report to Database --- //
		const newReport = await prisma.report.create({
			data: {
				title,
				description,
				reportType,
				generatedBy: session.user.id,
				reportData: reportData as Prisma.InputJsonValue // Cast needed for JSON type
			}
		});

		return NextResponse.json(newReport, { status: 201 });
	} catch (error) {
		console.error('[REPORT_GENERATION_POST]', error);
		// Provide more specific error if Zod validation failed
		if (error instanceof z.ZodError) {
			return new NextResponse(JSON.stringify(error.format()), { status: 400 });
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
