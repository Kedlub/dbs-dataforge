import { hash } from 'bcrypt';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';
import { UserRole } from '@/lib/types';

const SALT_ROUNDS = 10;

interface RegisterUserParams {
	username: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
	role?: string;
}

export async function registerUser(data: RegisterUserParams) {
	const { username, email, password, firstName, lastName, phone, role } = data;

	// Check if user with email already exists
	const existingUserByEmail = await prisma.user.findUnique({
		where: { email }
	});

	if (existingUserByEmail) {
		throw new Error('User with this email already exists');
	}

	// Check if user with username already exists
	const existingUserByUsername = await prisma.user.findUnique({
		where: { username }
	});

	if (existingUserByUsername) {
		throw new Error('Username is already taken');
	}

	// Get default user role if not specified
	let userRole = role;
	if (!userRole) {
		const defaultRole = await prisma.role.findFirst({
			where: { name: 'user' }
		});

		if (!defaultRole) {
			throw new Error('Default user role not found');
		}

		userRole = defaultRole.id;
	}

	// Hash password
	const passwordHash = await hash(password, SALT_ROUNDS);

	// Create new user
	const newUser = await prisma.user.create({
		data: {
			username,
			email,
			passwordHash,
			firstName,
			lastName,
			phone,
			roleId: userRole
		},
		include: {
			role: true
		}
	});

	return {
		id: newUser.id,
		username: newUser.username,
		email: newUser.email,
		firstName: newUser.firstName,
		lastName: newUser.lastName,
		role: newUser.role.name
	};
}

export async function getAuthSession() {
	return await getServerSession(authOptions);
}

export async function getCurrentUser() {
	const session = await getAuthSession();

	if (!session?.user?.id) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		include: { role: true }
	});

	return user;
}

export async function requireAuth(requiredRole?: UserRole | UserRole[]) {
	const session = await getAuthSession();

	if (!session?.user) {
		redirect('/auth/login');
	}

	if (requiredRole) {
		const userRole = session.user.role as UserRole;

		if (Array.isArray(requiredRole)) {
			if (!requiredRole.includes(userRole)) {
				redirect('/403');
			}
		} else if (userRole !== requiredRole) {
			redirect('/403');
		}
	}

	return session.user;
}
