import { PrismaClient } from '../generated/prisma';
import { seedFacilities } from './seed/seed-sport-facilities';
import { seedActivities } from './seed/seed-activities';
import { seedTimeSlots } from './seed/seed-time-slots';
import { seedUsers } from './seed/seed-users';
import { seedReservations } from './seed/seed-reservations';
import { seedEmployeeShifts } from './seed/seed-employee-shifts';

const prisma = new PrismaClient();

/**
 * Main seed function that orchestrates all the seeding processes
 */
async function main() {
	console.log('🌱 Starting database seeding...');

	try {
		// Seeding Order is Important due to dependencies!
		// 1. Users and Roles (Roles are handled within seedUsers now)
		await seedUsers();

		// 2. Facilities
		await seedFacilities();

		// 3. Activities (depends on Facilities)
		await seedActivities();

		// 4. Time Slots (depends on Facilities)
		await seedTimeSlots();

		// 5. Reservations (depends on Users, Activities, TimeSlots)
		await seedReservations();

		// 6. Employee Shifts (depends on Employees, which are created in seedUsers)
		await seedEmployeeShifts();

		console.log('\n🎉 Database seeding completed successfully!');
	} catch (error) {
		console.error('❌ Error during database seeding:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Execute the seed function
main()
	.catch((e) => {
		console.error('❌ Main seed error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
