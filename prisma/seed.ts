import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting seed process...');

	// Create default roles if they don't exist
	const roles = [
		{
			name: 'ADMIN',
			description: 'Administrator with full access'
		},
		{
			name: 'EMPLOYEE',
			description: 'Employee with management privileges'
		},
		{
			name: 'USER',
			description: 'Regular user with basic privileges'
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

		const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
		if (defaultAdminPassword === 'admin123') {
			console.warn('Warning: Using default admin password. This should be changed in production.');
		}
		const hashedPassword = await hash(defaultAdminPassword, 10);
		await prisma.user.create({
			data: {
				username: 'admin',
				passwordHash: hashedPassword,
				email: 'admin@example.com',
				firstName: 'Admin',
				lastName: 'User',
				roleId: adminRole.id
			}
		});
	}

	console.log('✅ Seed completed successfully');
}

main()
	.catch((e) => {
		console.error('❌ Seed error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
