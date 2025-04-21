import { PrismaClient } from '../../generated/prisma';
import { addDays, setHours, startOfHour } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Seed the EmployeeShift table with demo shifts
 */
async function seedEmployeeShifts() {
	console.log('⏰ Seeding employee shifts...');

	try {
		// Shifts are deleted in seedUsers, no need to delete here

		// Get employee(s)
		const employee = await prisma.employee.findFirst({
			where: { user: { username: 'zamestnanec' } }
		});

		if (!employee) {
			console.warn(
				"⚠️ Cannot seed shifts: Default employee 'zamestnanec' not found."
			);
			return [];
		}

		const shiftsToCreate = [];
		const today = new Date();

		// Example Shift 1: Tomorrow Morning
		const shift1Day = addDays(today, 1);
		const shift1Start = startOfHour(setHours(shift1Day, 8)); // Tomorrow 8:00:00.000
		const shift1End = startOfHour(setHours(shift1Day, 16)); // Tomorrow 16:00:00.000
		shiftsToCreate.push({
			employeeId: employee.id,
			startTime: shift1Start,
			endTime: shift1End,
			shiftType: 'Ranní'
		});

		// Example Shift 2: Day after tomorrow Afternoon
		const shift2Day = addDays(today, 2);
		const shift2Start = startOfHour(setHours(shift2Day, 14)); // Day after tomorrow 14:00:00.000
		const shift2End = startOfHour(setHours(shift2Day, 22)); // Day after tomorrow 22:00:00.000
		shiftsToCreate.push({
			employeeId: employee.id,
			startTime: shift2Start,
			endTime: shift2End,
			shiftType: 'Odpolední'
		});

		// Create shifts
		if (shiftsToCreate.length > 0) {
			await prisma.employeeShift.createMany({
				data: shiftsToCreate
			});
		}

		console.log(
			`  ✅ Successfully seeded ${shiftsToCreate.length} employee shifts.`
		);
		return shiftsToCreate;
	} catch (error) {
		console.error('❌ Error seeding employee shifts:', error);
		throw error;
	}
}

export { seedEmployeeShifts };

// Main execution block for standalone testing
async function main() {
	try {
		await seedEmployeeShifts();
	} catch (error) {
		console.error('❌ Failed to seed employee shifts independently:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main();
}
