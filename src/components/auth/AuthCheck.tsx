'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthCheckProps {
	children: ReactNode;
	fallback?: ReactNode;
	redirectTo?: string;
}

export default function AuthCheck({
	children,
	fallback,
	redirectTo = '/auth/login'
}: AuthCheckProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated && redirectTo) {
			router.push(redirectTo);
		}
	}, [isAuthenticated, isLoading, redirectTo, router]);

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-muted-foreground animate-pulse">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return fallback || null;
	}

	return <>{children}</>;
}
