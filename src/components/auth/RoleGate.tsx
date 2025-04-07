'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';
import { ReactNode } from 'react';

interface RoleGateProps {
	children: ReactNode;
	allowedRole: UserRole | UserRole[];
	fallback?: ReactNode;
}

export default function RoleGate({
	children,
	allowedRole,
	fallback
}: RoleGateProps) {
	const { hasRole, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-muted-foreground animate-pulse">Loading...</div>
			</div>
		);
	}

	if (!hasRole(allowedRole)) {
		return fallback || null;
	}

	return <>{children}</>;
}
