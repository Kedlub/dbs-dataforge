import { PrismaClient } from '../../generated/prisma';
import { addDays, setHours, startOfHour, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Seed the Reservation table with demo reservations
 */
async function seedReservations() {
	console.log('📅 Seeding reservations...');

	try {
		// Reservations are deleted in seedUsers due to dependency, no need to delete here
		// const count = await prisma.reservation.count();
		// if (count > 0) {
		//     await prisma.reservation.deleteMany({});
		//     console.log('Deleted existing reservations');
		// } else {
		//     console.log('No existing reservations to delete');
		// }

		// Get users, activities, and time slots needed for reservations
		const users = await prisma.user.findMany({
			where: { role: { name: 'USER' } }
		});
		const activities = await prisma.activity.findMany({
			where: { isActive: true }
		});
		const facilities = await prisma.facility.findMany({
			where: { status: 'ACTIVE' }
		});

		if (
			users.length === 0 ||
			activities.length === 0 ||
			facilities.length === 0
		) {
			console.warn(
				'⚠️ Cannot seed reservations: Missing users, active activities, or active facilities.'
			);
			return [];
		}

		// console.log(
		// 	`Found ${users.length} users, ${activities.length} active activities, ${facilities.length} active facilities.`
		// ); // Removed dependency count log

		const reservationsToCreate = [];
		const today = new Date();

		// --- Upcoming Reservations ---

		// Example 1: Petr Svoboda reserves Tennis tomorrow at 10 AM
		const user1 = users.find((u) => u.username === 'petr.svoboda');
		const tennisActivity = activities.find((a) =>
			a.name.toLowerCase().includes('tenis')
		);
		const tennisFacility = facilities.find((f) =>
			f.name.toLowerCase().includes('tenis')
		);

		// console.log(
		// 	`Checking for User 1: ${user1?.username}, Activity: ${tennisActivity?.name}, Facility: ${tennisFacility?.name}`
		// ); // Removed debug log

		if (user1 && tennisActivity && tennisFacility) {
			const targetDay = addDays(today, 1);
			const targetHour = setHours(targetDay, 10);
			const reservationTime = startOfHour(targetHour); // Ensures time is exactly 10:00:00.000
			// console.log(
			// 	`Searching for Tennis Slot starting exactly at: ${reservationTime.toISOString()} for Facility ID: ${tennisFacility.id}`
			// ); // Removed debug log
			const slot = await prisma.timeSlot.findFirst({
				where: {
					facilityId: tennisFacility.id,
					// Find the slot that starts exactly at the target hour
					startTime: { equals: reservationTime }, // Slot starts exactly at 10:00:00
					isAvailable: true
				}
			});

			if (slot) {
				// console.log(`Found Tennis Slot ID: ${slot.id}`); // Removed debug log
				reservationsToCreate.push({
					userId: user1.id,
					slotId: slot.id,
					activityId: tennisActivity.id,
					status: 'confirmed',
					totalPrice: tennisActivity.price // Assuming price is number
				});
				// Mark slot as unavailable (do this after creation for simplicity or use transaction)
			} else {
				console.log('⚠️ Tennis Slot NOT found for seeding.'); // Keep info log, changed to warning
			}
		}

		// Example 2: Eva Konecna reserves Yoga day after tomorrow at 18:00
		const user2 = users.find((u) => u.username === 'eva.konecna');
		const yogaActivity = activities.find((a) =>
			a.name.toLowerCase().includes('jóga')
		);
		const yogaFacility = facilities.find((f) =>
			f.name.toLowerCase().includes('jóga')
		);

		// console.log(
		// 	`Checking for User 2: ${user2?.username}, Activity: ${yogaActivity?.name}, Facility: ${yogaFacility?.name}`
		// ); // Removed debug log

		if (user2 && yogaActivity && yogaFacility) {
			const targetDay = addDays(today, 2);
			const targetHour = setHours(targetDay, 18);
			const reservationTime = startOfHour(targetHour); // Ensures time is exactly 18:00:00.000
			// console.log(
			// 	`Searching for Yoga Slot starting exactly at: ${reservationTime.toISOString()} for Facility ID: ${yogaFacility.id}`
			// ); // Removed debug log
			const slot = await prisma.timeSlot.findFirst({
				where: {
					facilityId: yogaFacility.id,
					// Find the slot that starts exactly at the target hour
					startTime: { equals: reservationTime }, // Slot starts exactly at 18:00:00
					isAvailable: true
				}
			});

			if (slot) {
				// console.log(`Found Yoga Slot ID: ${slot.id}`); // Removed debug log
				reservationsToCreate.push({
					userId: user2.id,
					slotId: slot.id,
					activityId: yogaActivity.id,
					status: 'pending',
					totalPrice: yogaActivity.price
				});
			} else {
				console.log('⚠️ Yoga Slot NOT found for seeding.'); // Keep info log, changed to warning
			}
		}

		// --- Past Reservations ---

		// Example 3: Jan Novak reserved Badminton 3 days ago at 14:00 (Completed)
		const user3 = user1; // Reuse user1 (Petr Svoboda)
		const badmintonActivity = activities.find((a) =>
			a.name.toLowerCase().includes('badminton')
		);

		// Find the facility linked to the Badminton activity
		let badmintonFacilityId: string | null = null;
		if (badmintonActivity) {
			const facilityLink = await prisma.facilityActivity.findFirst({
				where: { activityId: badmintonActivity.id }
			});
			if (facilityLink) {
				badmintonFacilityId = facilityLink.facilityId;
			}
		}

		if (user3 && badmintonActivity && badmintonFacilityId) {
			const targetDay = addDays(today, -3);
			const targetHour = setHours(targetDay, 14);
			const reservationTime = startOfHour(targetHour);
			const pastSlot = await prisma.timeSlot.findFirst({
				where: {
					facilityId: badmintonFacilityId,
					startTime: { equals: reservationTime }
					// We look for the slot even if it's marked unavailable now
				}
			});

			if (pastSlot) {
				reservationsToCreate.push({
					userId: user3.id,
					slotId: pastSlot.id,
					activityId: badmintonActivity.id,
					status: 'confirmed', // Past reservation, now marked as confirmed
					totalPrice: badmintonActivity.price
				});
				// Note: We don't need to update the past slot's availability again
			} else {
				console.log('⚠️ Badminton Slot from 3 days ago NOT found for seeding.');
			}
		}

		// Example 4: Eva Konecna had a Fitness reservation 5 days ago at 9:00 (Cancelled)
		const user4 = user2; // Reuse user2 (Eva Konecna)
		const fitnessActivity = activities.find((a) =>
			a.name.toLowerCase().includes('fitness')
		);
		const fitnessFacility = facilities.find((f) =>
			f.name.toLowerCase().includes('fitness')
		);

		if (user4 && fitnessActivity && fitnessFacility) {
			const targetDay = addDays(today, -5);
			const targetHour = setHours(targetDay, 9);
			const reservationTime = startOfHour(targetHour);
			const pastSlot = await prisma.timeSlot.findFirst({
				where: {
					facilityId: fitnessFacility.id,
					startTime: { equals: reservationTime }
				}
			});

			if (pastSlot) {
				reservationsToCreate.push({
					userId: user4.id,
					slotId: pastSlot.id,
					activityId: fitnessActivity.id,
					status: 'cancelled', // Past cancelled reservation
					cancellationReason: 'Seeding example: User illness',
					totalPrice: fitnessActivity.price
				});
			} else {
				console.log('⚠️ Fitness Slot from 5 days ago NOT found for seeding.');
			}
		}

		// Create reservations
		if (reservationsToCreate.length > 0) {
			await prisma.reservation.createMany({
				data: reservationsToCreate
			});

			// Update timeslots (simple approach, ideally use transaction)
			// Only update availability for *present and future* reservations being created now
			// Fetch the slots corresponding to the newly created reservations
			const createdReservationSlotIds = reservationsToCreate.map(
				(r) => r.slotId
			);
			const slots = await prisma.timeSlot.findMany({
				where: { id: { in: createdReservationSlotIds } }
			});

			// Filter these slots to find only those starting today or later
			const futureAndPresentSlotIdsToUpdate = slots
				.filter((slot) => slot.startTime >= startOfDay(today))
				.map((slot) => slot.id);

			if (futureAndPresentSlotIdsToUpdate.length > 0) {
				await prisma.timeSlot.updateMany({
					where: { id: { in: futureAndPresentSlotIdsToUpdate } },
					data: { isAvailable: false }
				});
			}
		}

		console.log(
			`  ✅ Successfully seeded ${reservationsToCreate.length} reservations.`
		);
		console.log();
		return reservationsToCreate; // Return the data created
	} catch (error) {
		console.error('❌ Error seeding reservations:', error);
		throw error;
	}
}

export { seedReservations };

// Main execution block for standalone testing
async function main() {
	console.log('🚀 Starting reservations seed script independently...');
	try {
		await seedReservations();
		console.log('✅ Reservations seeding finished successfully!');
	} catch (error) {
		console.error('❌ Failed to seed reservations independently:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main();
}
