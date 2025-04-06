'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HookFormAuth } from '@/components/auth/hook-form-auth';

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Parse and clean up the callbackUrl to prevent nested callbackUrl parameters
	const callbackParam = searchParams?.get('callbackUrl');
	const callbackUrl =
		callbackParam && !callbackParam.includes('/auth/login')
			? callbackParam
			: '/app';

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleLogin = async (data: any) => {
		try {
			setLoading(true);
			setError(null);

			const result = await signIn('credentials', {
				redirect: false,
				email: data.email,
				password: data.password
			});

			if (!result?.ok) {
				setError('Invalid email or password');
				return;
			}

			router.push(callbackUrl);
			router.refresh();
		} catch (error) {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<HookFormAuth
				type="login"
				onSubmit={handleLogin}
				loading={loading}
				error={error || undefined}
			/>
		</div>
	);
}
