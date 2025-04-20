import { Prisma, PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Seed default roles
 */
async function seedRoles() {
	console.log('  👑 Seeding roles...');

	const rolesData = [
		{
			name: 'ADMIN',
			description: 'Administrátor s plným přístupem'
		},
		{
			name: 'EMPLOYEE',
			description: 'Zaměstnanec s provozním přístupem'
		},
		{
			name: 'USER',
			description: 'Běžný uživatel se základním přístupem'
		}
	];

	let createdCount = 0;
	for (const role of rolesData) {
		const existingRole = await prisma.role.findUnique({
			where: { name: role.name }
		});
		if (!existingRole) {
			await prisma.role.create({ data: role });
			createdCount++;
		}
	}

	console.log(`  ✅ Roles seeded. ${createdCount} new roles created.`);
	return prisma.role.findMany(); // Return all roles (existing + new)
}

/**
 * Seed the User table with demo users
 */
async function seedUsers() {
	console.log('👤 Seeding users and employees...');

	try {
		// --- Deletion Order --- Must delete dependents first
		await prisma.employeeShift.deleteMany({});
		await prisma.reservation.deleteMany({});
		await prisma.employee.deleteMany({});

		// --- Delete Users (Except the roles reference) ---
		// Avoid deleting the admin if it exists and we just want to ensure it's there
		// For a clean seed, we often delete all users. Decide based on need.
		// Let's delete all for a clean slate, then recreate admin.
		await prisma.user.deleteMany({});

		// --- Seed Roles First ---
		const roles = await seedRoles();
		const userRole = roles.find((r) => r.name === 'USER');
		const adminRole = roles.find((r) => r.name === 'ADMIN');
		const employeeRole = roles.find((r) => r.name === 'EMPLOYEE');

		if (!userRole || !adminRole || !employeeRole) {
			throw new Error('Required roles (ADMIN, EMPLOYEE, USER) not found.');
		}

		// --- Create Admin User ---
		const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
		if (adminPassword === 'admin123') {
			console.warn(
				'⚠️ Using default admin password. Change this in production!'
			);
		}
		const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
		const adminUser = await prisma.user.create({
			data: {
				username: 'admin',
				passwordHash: adminPasswordHash,
				email: 'admin@activelife.cz',
				firstName: 'Admin',
				lastName: 'Správce',
				roleId: adminRole.id,
				phone: '111000111'
			}
		});

		// --- Create Employee User ---
		const employeePasswordHash = await bcrypt.hash('zam123', SALT_ROUNDS);
		const employeeUser = await prisma.user.create({
			data: {
				username: 'zamestnanec',
				passwordHash: employeePasswordHash,
				firstName: 'Jan',
				lastName: 'Novák',
				email: 'zamestnanec@activelife.cz',
				phone: '456789123',
				roleId: employeeRole.id,
				// Create the linked employee record
				employee: {
					create: {
						employeeNumber: 'E001',
						position: 'Recepční',
						hireDate: new Date()
					}
				}
			},
			include: { employee: true } // Include employee to get the employee ID
		});

		// --- Create Regular Users ---
		const userPasswordHash = await bcrypt.hash('user123', SALT_ROUNDS);
		const regularUser1 = await prisma.user.create({
			data: {
				username: 'petr.svoboda',
				passwordHash: userPasswordHash,
				firstName: 'Petr',
				lastName: 'Svoboda',
				email: 'petr.svoboda@example.com',
				phone: '777111222',
				roleId: userRole.id
			}
		});

		const regularUser2 = await prisma.user.create({
			data: {
				username: 'eva.konecna',
				passwordHash: userPasswordHash,
				firstName: 'Eva',
				lastName: 'Konečná',
				email: 'eva.konecna@example.com',
				phone: '603999888',
				roleId: userRole.id
			}
		});

		const allUsers = [adminUser, employeeUser, regularUser1, regularUser2];
		console.log(
			`  ✅ Successfully seeded ${allUsers.length} users and employees.`
		);
		console.log();
		return allUsers;
	} catch (error) {
		console.error('❌ Error seeding users:', error);
		throw error; // Re-throw the error to be caught by the main seed script
	}
}

export { seedUsers }; // Export only the main user seeding function

// Remove the main execution block if this file is only meant to be imported
// Keeping it allows running `ts-node prisma/seed/seed-users.ts` for isolated testing
/**
 * Main function to execute the seed script (for standalone execution)
 */
async function main() {
	try {
		await seedUsers();
	} catch (error) {
		console.error('❌ Failed to seed users independently:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main();
}
