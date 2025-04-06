'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
	const router = useRouter();

	useEffect(() => {
		const performLogout = async () => {
			await signOut({ redirect: false });
			router.push('/auth/login');
		};

		performLogout();
	}, [router]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Logging out...</h1>
				<p className="text-muted-foreground mt-2">
					Please wait while we sign you out.
				</p>
			</div>
		</div>
	);
}
