import 'next-auth';
import { User } from 'next-auth';

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
