'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types';

export function useAuth() {
	const { data: session, status, update } = useSession();

	const isAuthenticated = status === 'authenticated' && !!session?.user;
	const isLoading = status === 'loading';
	const user = session?.user;

	// Helper function to refresh the session
	const refreshSession = async () => {
		try {
			await update();
			return true;
		} catch (error) {
			console.error('Failed to refresh session:', error);
			return false;
		}
	};

	const hasRole = (requiredRole: UserRole | UserRole[]) => {
		if (!isAuthenticated || !user?.role) return false;

		if (Array.isArray(requiredRole)) {
			return requiredRole.includes(user.role as UserRole);
		}

		return user.role === requiredRole;
	};

	const isAdmin = hasRole('ADMIN');
	const isEmployee = hasRole(['ADMIN', 'EMPLOYEE']);
	const isUser = isAuthenticated;

	return {
		user,
		isAuthenticated,
		isLoading,
		status, // Expose raw session status
		hasRole,
		isAdmin,
		isEmployee,
		isUser,
		refreshSession // Add ability to refresh session
	};
}
