import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addDays, startOfDay, endOfDay, setHours, addHours } from 'date-fns';
import { Prisma } from '../../../../../../generated/prisma'; // Adjust path if needed

const SLOT_DURATION_MINUTES = 60;
const DAYS_TO_GENERATE = 7;

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const session = await getServerSession(authOptions);
	const { id: facilityId } = params;

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Přístup odepřen.' }, { status: 403 });
	}

	if (!facilityId) {
		return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
	}

	try {
		// 1. Fetch facility details
		const facility = await prisma.facility.findUnique({
			where: { id: facilityId }
		});

		if (!facility) {
			return NextResponse.json(
				{ error: 'Sportoviště nenalezeno' },
				{ status: 404 }
			);
		}

		// --- Generate Slots ---
		const today = new Date();
		const startDate = startOfDay(today);
		const endDate = startOfDay(addDays(today, DAYS_TO_GENERATE)); // Generate up to the start of the 7th day

		const slotsToCreate: Prisma.TimeSlotCreateManyInput[] = [];

		for (let day = startDate; day < endDate; day = addDays(day, 1)) {
			const dayStartHour = facility.openingHour;
			const dayEndHour = facility.closingHour;

			for (let hour = dayStartHour; hour < dayEndHour; hour++) {
				const slotStartTime = setHours(day, hour);
				const slotEndTime = addHours(slotStartTime, SLOT_DURATION_MINUTES / 60);

				slotsToCreate.push({
					facilityId: facility.id,
					startTime: slotStartTime,
					endTime: slotEndTime,
					isAvailable: true
				});
			}
		}

		// 2. Use transaction: Delete existing future slots & create new ones
		await prisma.$transaction(async (tx) => {
			// Delete slots starting from today onwards for this facility
			// IMPORTANT: Only delete AVAILABLE slots to avoid deleting reservations
			await tx.timeSlot.deleteMany({
				where: {
					facilityId: facility.id,
					startTime: {
						gte: startDate // Delete slots from the beginning of today
					},
					isAvailable: true // Only delete slots that are not reserved
				}
			});

			// Create the new slots
			if (slotsToCreate.length > 0) {
				await tx.timeSlot.createMany({
					data: slotsToCreate,
					skipDuplicates: true // Keep this for safety
				});
			}
		});

		return NextResponse.json({
			message: `Časové sloty pro ${DAYS_TO_GENERATE} dní byly úspěšně vygenerovány.`,
			slotsGenerated: slotsToCreate.length
		});
	} catch (error) {
		console.error(
			`Error generating time slots for facility ${facilityId}:`,
			error
		);
		return NextResponse.json(
			{ error: 'Interní chyba serveru při generování slotů.' },
			{ status: 500 }
		);
	}
}
