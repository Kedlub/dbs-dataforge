import 'next-auth';
import { User } from 'next-auth';
import { Prisma } from '../../generated/prisma';
import { z } from 'zod';

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
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'USER';

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

// Facility types
export interface Facility {
	id: string;
	name: string;
	description: string | null;
	capacity: number;
	status: string;
	openingHour: number;
	closingHour: number;
}

// Activity types
export interface Activity {
	id: string;
	name: string;
	description: string | null;
	durationMinutes: number;
	price: number | string;
	maxParticipants: number;
	isActive: boolean;
}

// Time slot types
export interface TimeSlot {
	id: string;
	facilityId: string;
	startTime: string | Date;
	endTime: string | Date;
	isAvailable: boolean;
}

// Reservation types
export interface Reservation {
	id: string;
	userId: string;
	slotId: string;
	activityId: string;
	createdAt: string | Date;
	status: string;
	cancellationReason?: string | null;
	totalPrice: number | string;
	lastModified: string | Date;
	// Relations (when included in queries)
	user?: User;
	timeSlot?: TimeSlot;
	activity?: Activity;
}

// Report types
export interface Report {
	id: string;
	title: string;
	description?: string | null;
	generatedBy: string;
	generatedAt: string | Date;
	reportType: string;
	reportData: any;
}

// Example type - replace or remove if not needed
export interface ExampleData {
	id: number;
	name: string;
	value: number;
}

// User Management Types

// Combine Prisma User and Role types for API responses/frontend use
// Exclude passwordHash from the default User type
type UserBase = Omit<
	Prisma.UserGetPayload<{ include: { role: true } }>,
	'passwordHash'
>;
export interface UserWithRole extends UserBase {}

// Type for Role, derived from Prisma
export type Role = Prisma.RoleGetPayload<{}>;

// Zod schema for creating a new user
export const UserCreateSchema = z.object({
	username: z.string().min(3, 'Uživatelské jméno musí mít alespoň 3 znaky.'),
	password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků.'),
	firstName: z.string().min(1, 'Křestní jméno je povinné.'),
	lastName: z.string().min(1, 'Příjmení je povinné.'),
	email: z.string().email('Neplatný formát emailu.'),
	phone: z.string().optional(), // Optional phone number
	roleId: z.string().uuid('Neplatné ID role.'),
	isActive: z.boolean().default(true)
});

export type UserCreateData = z.infer<typeof UserCreateSchema>;

// Zod schema for editing an existing user
// We might not allow changing username or password here, or handle password change separately
export const UserEditSchema = z.object({
	firstName: z.string().min(1, 'Křestní jméno je povinné.').optional(),
	lastName: z.string().min(1, 'Příjmení je povinné.').optional(),
	email: z.string().email('Neplatný formát emailu.').optional(),
	phone: z.string().optional(),
	roleId: z.string().uuid('Neplatné ID role.'),
	isActive: z.boolean()
});

export type UserEditData = z.infer<typeof UserEditSchema>;
