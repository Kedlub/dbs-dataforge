'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HookFormAuth } from '@/components/auth/hook-form-auth';

export default function RegisterPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Parse and clean up the callbackUrl to prevent nested callbackUrl parameters
	const callbackParam = searchParams?.get('callbackUrl');
	const callbackUrl =
		callbackParam && !callbackParam.includes('/auth/') ? callbackParam : '/app';

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleRegister = async (data: any) => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: data.username,
					firstName: data.firstName,
					lastName: data.lastName,
					email: data.email,
					password: data.password,
					phone: data.phone || null
				})
			});

			const responseData = await response.json();

			if (!response.ok) {
				setError(responseData.message || 'Registrace se nezdařila');
				return;
			}

			// Automatically sign in the user after successful registration
			const result = await signIn('credentials', {
				redirect: false,
				email: data.email,
				password: data.password
			});

			if (!result?.ok) {
				setError(
					'Registrace proběhla úspěšně, ale automatické přihlášení se nezdařilo. Zkuste se přihlásit ručně.'
				);
				return;
			}

			router.push(callbackUrl);
			router.refresh();
		} catch (error) {
			setError('Něco se pokazilo. Zkuste to prosím znovu.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center py-8">
			<HookFormAuth
				type="register"
				onSubmit={handleRegister}
				loading={loading}
				error={error || undefined}
			/>
		</div>
	);
}
