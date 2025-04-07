import { PrismaClient } from '../../generated/prisma';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed the User table with demo users
 */
async function seedUsers() {
	console.log('👤 Seeding users...');

	try {
		// Delete existing employees first due to foreign key constraints
		const employeeCount = await prisma.employee.count();
		if (employeeCount > 0) {
			await prisma.employee.deleteMany({});
			console.log('Deleted existing employees');
		}

		// Delete existing reservations first due to foreign key constraints
		const reservationCount = await prisma.reservation.count();
		if (reservationCount > 0) {
			await prisma.reservation.deleteMany({});
			console.log('Deleted existing reservations');
		}

		// Delete existing users
		const count = await prisma.user.count();
		if (count > 0) {
			await prisma.user.deleteMany({});
			console.log('Deleted existing users');
		} else {
			console.log('No existing users or reservations to delete');
		}

		// Check if we have roles, create them if not
		const roleCount = await prisma.role.count();
		if (roleCount === 0) {
			await seedRoles();
		}

		// Get role IDs
		const roles = await prisma.role.findMany();
		const userRoleId = roles.find((r) => r.name === 'user')?.id || '';
		const adminRoleId = roles.find((r) => r.name === 'admin')?.id || '';
		const employeeRoleId = roles.find((r) => r.name === 'employee')?.id || '';

		// Create demo user with fixed ID for testing reservations
		const demoUser = await prisma.user.create({
			data: {
				id: '00000000-0000-0000-0000-000000000000', // Demo user ID used in the reservation API
				username: 'demouser',
				passwordHash: 'demo123', // Plain text for seed only; in production, use hashed passwords
				firstName: 'Demo',
				lastName: 'User',
				email: 'demo@activelife.com',
				phone: '+1234567890',
				roleId: userRoleId
			}
		});

		// Create admin user
		const adminUser = await prisma.user.create({
			data: {
				id: randomUUID(),
				username: 'admin',
				passwordHash: 'admin123', // Plain text for seed only
				firstName: 'Admin',
				lastName: 'User',
				email: 'admin@activelife.com',
				phone: '+1987654321',
				roleId: adminRoleId
			}
		});

		// Create employee user
		const employeeUser = await prisma.user.create({
			data: {
				id: randomUUID(),
				username: 'employee',
				passwordHash: 'employee123', // Plain text for seed only
				firstName: 'Employee',
				lastName: 'User',
				email: 'employee@activelife.com',
				phone: '+1456789123',
				roleId: employeeRoleId,
				employee: {
					create: {
						position: 'Receptionist',
						hireDate: new Date(),
						employeeNumber: 'EMP001'
					}
				}
			}
		});

		// Create a few regular users
		const regularUsers = await Promise.all([
			prisma.user.create({
				data: {
					id: randomUUID(),
					username: 'johndoe',
					passwordHash: 'password123', // Plain text for seed only
					firstName: 'John',
					lastName: 'Doe',
					email: 'john@example.com',
					phone: '+1122334455',
					roleId: userRoleId
				}
			}),
			prisma.user.create({
				data: {
					id: randomUUID(),
					username: 'janedoe',
					passwordHash: 'password123', // Plain text for seed only
					firstName: 'Jane',
					lastName: 'Doe',
					email: 'jane@example.com',
					phone: '+1555666777',
					roleId: userRoleId
				}
			})
		]);

		const allUsers = [demoUser, adminUser, employeeUser, ...regularUsers];
		console.log(`✅ Successfully seeded ${allUsers.length} users`);
		return allUsers;
	} catch (error) {
		console.error('Error seeding users:', error);
		throw error;
	}
}

/**
 * Seed roles if they don't exist
 */
async function seedRoles() {
	console.log('👑 Seeding roles...');

	const rolesData = [
		{
			id: randomUUID(),
			name: 'admin',
			description: 'Administrator with full access'
		},
		{
			id: randomUUID(),
			name: 'employee',
			description: 'Staff member with operational access'
		},
		{
			id: randomUUID(),
			name: 'user',
			description: 'Regular user with basic access'
		}
	];

	await prisma.role.createMany({
		data: rolesData,
		skipDuplicates: true
	});

	console.log(`✅ Successfully seeded ${rolesData.length} roles`);
}

/**
 * Main function to execute the seed script
 */
async function main() {
	console.log('Starting users seed script...');

	try {
		const users = await seedUsers();
		console.log(`Seeded ${users.length} users successfully!`);
	} catch (error) {
		console.error('Error seeding users:', error);
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

export { seedUsers };
