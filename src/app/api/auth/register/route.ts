import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt';
import prisma from '@/lib/db';

// Registration validation schema
const registerSchema = z.object({
	username: z
		.string()
		.min(3, { message: 'Username must be at least 3 characters' })
		.max(20, { message: 'Username must be less than 20 characters' }),
	firstName: z.string().min(1, { message: 'First name is required' }),
	lastName: z.string().min(1, { message: 'Last name is required' }),
	email: z
		.string()
		.min(1, { message: 'Email is required' })
		.email({ message: 'Must be a valid email' }),
	password: z
		.string()
		.min(6, { message: 'Password must be at least 6 characters' }),
	phone: z.string().nullable().optional()
});

export async function POST(req: Request) {
	try {
		const body = await req.json();

		// Validate input
		const result = registerSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ message: 'Invalid input data', errors: result.error.flatten() },
				{ status: 400 }
			);
		}

		const { username, firstName, lastName, email, password, phone } =
			result.data;

		// Check if email or username already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }]
			}
		});

		if (existingUser) {
			const field = existingUser.email === email ? 'email' : 'username';
			return NextResponse.json(
				{ message: `User with this ${field} already exists` },
				{ status: 409 }
			);
		}

		// Find the USER role
		const userRole = await prisma.role.findUnique({
			where: { name: 'USER' }
		});

		if (!userRole) {
			return NextResponse.json(
				{ message: 'Default user role not found' },
				{ status: 500 }
			);
		}

		// Hash the password
		const passwordHash = await hash(password, 10);

		// Create user with default role
		const user = await prisma.user.create({
			data: {
				username,
				firstName,
				lastName,
				email,
				passwordHash,
				phone,
				roleId: userRole.id,
				isActive: true
			}
		});

		// Remove sensitive data before returning
		const { passwordHash: _, ...userWithoutPassword } = user;

		return NextResponse.json(
			{ message: 'User registered successfully', user: userWithoutPassword },
			{ status: 201 }
		);
	} catch (error) {
		console.error('Registration error:', error);
		return NextResponse.json(
			{ message: 'Internal server error' },
			{ status: 500 }
		);
	}
}
