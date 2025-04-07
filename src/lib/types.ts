import 'next-auth';

declare module 'next-auth' {
	interface User {
		id: string;
		username: string;
		role: string;
	}

	interface Session {
		user: {
			id: string;
			name: string | null;
			email: string | null;
			username: string;
			role: string;
		};
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		username: string;
		role: string;
	}
}

// Role Types
export type UserRole = 'admin' | 'employee' | 'user';

export interface RoleData {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
}

export interface UserData {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	registrationDate: Date;
	isActive: boolean;
	roleId: string;
	role: RoleData;
}

export interface AuthFormData {
	email: string;
	password: string;
}
