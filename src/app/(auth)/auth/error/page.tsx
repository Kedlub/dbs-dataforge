'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
	const searchParams = useSearchParams();
	const error = searchParams.get('error');

	let errorMessage = 'An unknown error occurred during authentication.';

	// Map error codes to user-friendly messages
	if (error === 'CredentialsSignin') {
		errorMessage = 'Invalid email or password. Please try again.';
	} else if (error === 'SessionRequired') {
		errorMessage = 'You must be signed in to access this page.';
	} else if (error === 'OAuthAccountNotLinked') {
		errorMessage =
			'To confirm your identity, sign in with the same account you used originally.';
	} else if (error === 'OAuthSignInFailed') {
		errorMessage =
			'Authentication with social login provider failed. Please try again.';
	} else if (error === 'OAuthCallbackError') {
		errorMessage = 'Social login callback error. Please try again.';
	} else if (error === 'EmailSignInFailed') {
		errorMessage =
			'The login link is invalid or has expired. Please try again.';
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-12">
			<div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
				<div className="space-y-2 text-center">
					<h1 className="text-destructive text-2xl font-bold">
						Authentication Error
					</h1>
					<p className="text-muted-foreground">{errorMessage}</p>
				</div>

				<div className="flex justify-center space-x-4 pt-4">
					<Button asChild variant="outline">
						<Link href="/auth/login">Return to Login</Link>
					</Button>
					<Button asChild>
						<Link href="/">Back to Home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
