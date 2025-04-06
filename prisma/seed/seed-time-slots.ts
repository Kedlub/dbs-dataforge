import { PrismaClient } from '../../generated/prisma';
import { addDays, addHours, setHours, startOfDay } from 'date-fns';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed the TimeSlot table with time slots for facilities
 */
async function seedTimeSlots() {
	console.log('🕒 Seeding time slots...');

	try {
		// Delete existing time slots
		const count = await prisma.timeSlot.count();
		if (count > 0) {
			await prisma.timeSlot.deleteMany({});
			console.log('Deleted existing time slots');
		} else {
			console.log('No existing time slots to delete');
		}

		// Get all facilities
		const facilities = await prisma.facility.findMany();
		if (facilities.length === 0) {
			console.log('No facilities found to create time slots for');
			return [];
		}

		const allTimeSlots = [];
		const today = startOfDay(new Date());

		// Create time slots for each facility for the next 7 days
		for (const facility of facilities) {
			// Create slots based on facility opening and closing hours
			for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
				const currentDay = addDays(today, dayOffset);

				// Skip if facility is closed
				if (facility.status === 'closed') continue;

				// Create hourly slots during opening hours
				for (
					let hour = facility.openingHour;
					hour < facility.closingHour;
					hour++
				) {
					const startTime = setHours(currentDay, hour);
					const endTime = addHours(startTime, 1);

					const timeSlot = {
						id: randomUUID(),
						facilityId: facility.id,
						startTime,
						endTime,
						isAvailable: facility.status === 'active'
					};

					allTimeSlots.push(timeSlot);
				}
			}
		}

		// Bulk create the time slots
		const createdTimeSlots = await prisma.timeSlot.createMany({
			data: allTimeSlots,
			skipDuplicates: true
		});

		console.log(`✅ Successfully seeded ${createdTimeSlots.count} time slots`);
		return allTimeSlots;
	} catch (error) {
		console.error('Error seeding time slots:', error);
		throw error;
	}
}

/**
 * Main function to execute the seed script
 */
async function main() {
	console.log('Starting time slots seed script...');

	try {
		const timeSlots = await seedTimeSlots();
		console.log(`Seeded ${timeSlots.length} time slots successfully!`);
	} catch (error) {
		console.error('Error seeding time slots:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Execute the seed function if this file is run directly
if (require.main === module) {
	main()
		.catch((e) => {
			console.error(e);
			process.exit(1);
		})
		.finally(async () => {
			await prisma.$disconnect();
		});
}

export { seedTimeSlots };
