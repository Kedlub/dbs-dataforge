import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
	try {
		// Ensure only admins can access this route
		await requireAuth('ADMIN');

		const users = await db.user.findMany({
			include: {
				role: true // Include role information
			},
			orderBy: {
				registrationDate: 'desc'
			}
		});

		// Exclude password hash from the response
		const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);

		return NextResponse.json(usersWithoutPassword);
	} catch (error) {
		console.error('[API_USERS_GET]', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		// Ensure only admins can access this route
		await requireAuth('ADMIN');

		const body = await req.json();
		const {
			username,
			password,
			firstName,
			lastName,
			email,
			phone,
			roleId,
			isActive = true // Default to active
		} = body;

		// Basic validation
		if (
			!username ||
			!password ||
			!firstName ||
			!lastName ||
			!email ||
			!roleId
		) {
			return new NextResponse('Missing required fields', { status: 400 });
		}

		// Check if user already exists
		const existingUser = await db.user.findUnique({
			where: { username }
		});
		if (existingUser) {
			return new NextResponse('Username already taken', { status: 409 });
		}

		const existingEmail = await db.user.findUnique({
			where: { email }
		});
		if (existingEmail) {
			return new NextResponse('Email already in use', { status: 409 });
		}

		// Hash password
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);

		const newUser = await db.user.create({
			data: {
				username,
				passwordHash,
				firstName,
				lastName,
				email,
				phone,
				roleId,
				isActive,
				registrationDate: new Date()
			},
			include: {
				role: true
			}
		});

		// Exclude password hash from the response
		const { passwordHash: _, ...userWithoutPassword } = newUser;

		return NextResponse.json(userWithoutPassword, { status: 201 });
	} catch (error) {
		console.error('[API_USERS_POST]', error);
		// Prisma unique constraint violation
		if (
			error instanceof Error &&
			'code' in error &&
			(error as any).code === 'P2002'
		) {
			return new NextResponse('Username or email already exists', {
				status: 409
			});
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
