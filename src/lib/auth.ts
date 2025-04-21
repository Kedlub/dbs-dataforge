import { hash, compare } from 'bcrypt';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/db';
import { UserRole } from '@/lib/types';

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Email and password required');
				}

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email
					},
					include: {
						role: true
					}
				});

				// Add null check for user.passwordHash to satisfy linter
				if (!user || !user.isActive || !user.passwordHash) {
					throw new Error(
						'No active user found with this email or password hash missing'
					);
				}

				const isPasswordValid = await compare(
					credentials.password,
					user.passwordHash // Now checked for null
				);

				if (!isPasswordValid) {
					throw new Error('Invalid password');
				}

				return {
					id: user.id,
					email: user.email,
					name: `${user.firstName} ${user.lastName}`,
					username: user.username,
					role: user.role.name
				};
			}
		})
	],
	pages: {
		signIn: '/auth/login',
		signOut: '/auth/logout',
		error: '/auth/error'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
				token.username = user.username;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
				session.user.username = token.username as string;
				session.user.role = token.role as string;
			}
			return session;
		}
	},
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60 // 24 hours
	},
	cookies: {
		sessionToken: {
			name: `next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: process.env.NODE_ENV === 'production'
			}
		}
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === 'development'
};

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
