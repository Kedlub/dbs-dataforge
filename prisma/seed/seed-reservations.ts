import { PrismaClient, Prisma } from '../../generated/prisma';
import { addDays, setHours, startOfHour, startOfDay } from 'date-fns';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Define types for clarity
type User = { id: string; username: string };
type Activity = {
	id: string;
	name: string;
	price: Prisma.Decimal;
};
type FacilityActivityLink = { activityId: string; facilityId: string };
type Facility = {
	id: string;
	name: string;
	openingHour: number;
	closingHour: number;
};
type TimeSlot = {
	id: string;
	facilityId: string;
	startTime: Date;
	endTime: Date;
	isAvailable: boolean;
};

// Helper function to pick a random element from an array
function getRandomElement<T>(arr: T[]): T | undefined {
	if (arr.length === 0) return undefined;
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Seed the Reservation table with a more comprehensive set of demo reservations
 */
async function seedReservations() {
	console.log('📅 Seeding reservations...');

	try {
		// Reservations are deleted in seedUsers due to dependency, no need to delete here.

		// Get all necessary data upfront
		const users: User[] = await prisma.user.findMany({
			where: { role: { name: 'USER' } },
			select: { id: true, username: true }
		});

		const activities: Activity[] = await prisma.activity.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				price: true
			}
		});

		const facilityActivityLinks: FacilityActivityLink[] =
			await prisma.facilityActivity.findMany({
				select: { activityId: true, facilityId: true }
			});

		const facilities: Facility[] = await prisma.facility.findMany({
			where: { status: 'ACTIVE' },
			select: { id: true, name: true, openingHour: true, closingHour: true }
		});

		const timeSlots: TimeSlot[] = await prisma.timeSlot.findMany(); // Get all slots

		if (
			users.length === 0 ||
			activities.length === 0 ||
			timeSlots.length === 0
		) {
			console.warn(
				'⚠️ Cannot seed reservations: Missing users, active activities, or time slots.'
			);
			return [];
		}

		const reservationsToCreate = [];
		const createdSlotIds = new Set<string>(); // Track slots used in this seeding run
		const today = startOfDay(new Date());
		const DAYS_TO_SEED_PAST = 5;
		const DAYS_TO_SEED_FUTURE = 5;
		const RESERVATIONS_PER_DAY = 3; // Attempt to create this many reservations per day

		// --- Generate Reservations for Past and Future Days ---
		for (
			let dayOffset = -DAYS_TO_SEED_PAST;
			dayOffset <= DAYS_TO_SEED_FUTURE;
			dayOffset++
		) {
			if (dayOffset === 0) continue; // Skip today for simplicity or handle separately if needed

			const currentDay = addDays(today, dayOffset);
			const isPastDay = dayOffset < 0;
			let reservationsCreatedThisDay = 0;

			console.log(
				`  ⏳ Processing ${isPastDay ? 'past' : 'future'} day: ${currentDay.toISOString().split('T')[0]}...`
			);

			// Attempt to create a few reservations for this day
			for (let i = 0; i < RESERVATIONS_PER_DAY * users.length; i++) {
				// Try more times to increase chances
				if (reservationsCreatedThisDay >= RESERVATIONS_PER_DAY) break; // Stop if we hit the target for the day

				const user = getRandomElement(users);
				const activity = getRandomElement(activities);
				if (!user || !activity) continue;

				// Find facilities where this activity can happen using the separate links
				const possibleFacilityIds = facilityActivityLinks
					.filter((link) => link.activityId === activity.id)
					.map((link) => link.facilityId);

				if (possibleFacilityIds.length === 0) continue; // Skip if activity isn't linked to any facility

				const possibleFacilities = facilities.filter((f) =>
					possibleFacilityIds.includes(f.id)
				);
				const facility = getRandomElement(possibleFacilities);
				if (!facility) continue;

				// Pick a random hour within the facility's operating hours
				const randomHour =
					facility.openingHour +
					Math.floor(
						Math.random() * (facility.closingHour - facility.openingHour)
					);
				const targetTime = startOfHour(setHours(currentDay, randomHour));

				// Find a suitable time slot
				const potentialSlot = timeSlots.find(
					(slot) =>
						slot.facilityId === facility.id &&
						slot.startTime.getTime() === targetTime.getTime() && // Exact match on time
						!createdSlotIds.has(slot.id) && // Not already used in this seed run
						(isPastDay || slot.isAvailable) // Must be available if it's for the future
				);

				if (potentialSlot) {
					const status = isPastDay
						? Math.random() > 0.2
							? 'confirmed'
							: 'cancelled' // 80% confirmed, 20% cancelled for past
						: Math.random() > 0.3
							? 'confirmed'
							: 'pending'; // 70% confirmed, 30% pending for future

					const reservationData: any = {
						id: randomUUID(),
						userId: user.id,
						slotId: potentialSlot.id,
						activityId: activity.id,
						status: status,
						totalPrice: Number(activity.price),
						createdAt: addDays(potentialSlot.startTime, -1) // Set created date before reservation date
					};

					if (status === 'cancelled') {
						reservationData.cancellationReason = isPastDay
							? 'Seeding: Zrušeno (minulost)'
							: 'Seeding: Zrušeno (budoucnost)';
					}

					reservationsToCreate.push(reservationData);
					createdSlotIds.add(potentialSlot.id); // Mark slot as used for this run
					reservationsCreatedThisDay++;
				}
			}
			if (reservationsCreatedThisDay > 0) {
				console.log(
					`    -> Created ${reservationsCreatedThisDay} reservations.`
				);
			} else {
				console.log(
					`    -> No suitable slots found or activities/facilities mismatch.`
				);
			}
		}

		// Create reservations
		if (reservationsToCreate.length > 0) {
			console.log(`
  💾 Creating ${reservationsToCreate.length} reservation records in the database...`);
			// Use createMany for efficiency
			await prisma.reservation.createMany({
				data: reservationsToCreate,
				skipDuplicates: true // Should not happen with UUIDs but good practice
			});

			// Update timeslots availability for the *future* reservations just created
			// Filter the used slots to get only those that are in the future and were 'confirmed' or 'pending'
			const futureSlotsToUpdate = reservationsToCreate
				.filter((res) => {
					const slot = timeSlots.find((ts) => ts.id === res.slotId);
					return (
						slot &&
						slot.startTime >= today &&
						(res.status === 'confirmed' || res.status === 'pending')
					);
				})
				.map((res) => res.slotId);

			if (futureSlotsToUpdate.length > 0) {
				console.log(
					`  🔄 Updating availability for ${futureSlotsToUpdate.length} future time slots...`
				);
				await prisma.timeSlot.updateMany({
					where: {
						id: { in: futureSlotsToUpdate },
						isAvailable: true // Only update if it's currently available
					},
					data: { isAvailable: false }
				});
			} else {
				console.log('  ℹ️ No future time slots needed availability updates.');
			}
		} else {
			console.log('  ℹ️ No reservations generated to seed.');
		}

		console.log(
			`
  ✅ Successfully seeded ${reservationsToCreate.length} reservations.`
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
