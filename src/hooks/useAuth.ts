'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/types';

export function useAuth() {
	const { data: session, status } = useSession();

	const isAuthenticated = status === 'authenticated' && !!session?.user;
	const isLoading = status === 'loading';
	const user = session?.user;

	const hasRole = (requiredRole: UserRole | UserRole[]) => {
		if (!isAuthenticated || !user?.role) return false;

		if (Array.isArray(requiredRole)) {
			return requiredRole.includes(user.role as UserRole);
		}

		return user.role === requiredRole;
	};

	const isAdmin = hasRole('admin');
	const isEmployee = hasRole(['admin', 'employee']);
	const isUser = isAuthenticated;

	return {
		user,
		isAuthenticated,
		isLoading,
		hasRole,
		isAdmin,
		isEmployee,
		isUser
	};
}
