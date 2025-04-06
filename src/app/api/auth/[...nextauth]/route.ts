import { compare } from 'bcrypt';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/db';

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

				if (!user || !user.isActive) {
					throw new Error('No active user found with this email');
				}

				const isPasswordValid = await compare(
					credentials.password,
					user.passwordHash
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
		strategy: 'jwt'
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
