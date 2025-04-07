import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcrypt';
import { seedFacilities } from './seed/seed-sport-facilities';
import { seedActivities } from './seed/seed-activities';
import { seedTimeSlots } from './seed/seed-time-slots';
import { seedUsers } from './seed/seed-users';

const prisma = new PrismaClient();

/**
 * Create default roles if they don't exist
 */
async function createDefaultRoles() {
	const roles = [
		{
			name: 'ADMIN',
			description: 'Administrátor s plným přístupem'
		},
		{
			name: 'EMPLOYEE',
			description: 'Zaměstnanec s rozšířenými oprávněními'
		},
		{
			name: 'USER',
			description: 'Běžný uživatel se základními oprávněními'
		}
	];

	console.log('Creating default roles...');

	for (const role of roles) {
		const existingRole = await prisma.role.findUnique({
			where: { name: role.name }
		});

		if (!existingRole) {
			await prisma.role.create({
				data: role
			});
			console.log(`Created role: ${role.name}`);
		} else {
			console.log(`Role already exists: ${role.name}`);
		}
	}
}

/**
 * Create default admin user if no admin exists
 */
async function createDefaultAdmin() {
	// Get the admin role
	const adminRole = await prisma.role.findUnique({
		where: { name: 'ADMIN' }
	});

	if (!adminRole) {
		throw new Error('Admin role not found');
	}

	// Create default admin user if no admin exists
	const adminCount = await prisma.user.count({
		where: {
			role: {
				name: 'ADMIN'
			}
		}
	});

	if (adminCount === 0) {
		console.log('Creating default admin user...');

		const defaultAdminPassword =
			process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
		if (defaultAdminPassword === 'admin123') {
			console.warn(
				'Warning: Using default admin password. This should be changed in production.'
			);
		}
		const hashedPassword = await hash(defaultAdminPassword, 10);
		await prisma.user.create({
			data: {
				username: 'admin',
				passwordHash: hashedPassword,
				email: 'admin@example.cz',
				firstName: 'Admin',
				lastName: 'Správce',
				roleId: adminRole.id
			}
		});
	}
}

/**
 * Main seed function that orchestrates all the seeding processes
 */
async function main() {
	console.log('🌱 Starting database seeding...');

	try {
		// Create default roles
		await createDefaultRoles();

		// Create default admin user if needed
		await createDefaultAdmin();

		// Seed sports facilities
		const facilities = await seedFacilities();
		console.log(
			`✅ Successfully seeded ${facilities.length} sports facilities`
		);

		// Seed activities and link them to facilities
		const activities = await seedActivities();
		console.log(`✅ Successfully seeded ${activities.length} activities`);

		// Seed time slots for reservations
		const timeSlots = await seedTimeSlots();
		console.log(`✅ Successfully seeded ${timeSlots.length} time slots`);

		console.log('✅ Database seeding completed successfully!');
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
		console.error('❌ Seed error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
