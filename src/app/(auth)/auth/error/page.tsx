'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
	const searchParams = useSearchParams();
	const error = searchParams.get('error');

	let errorMessage = 'Během ověřování došlo k neznámé chybě.';

	// Map error codes to user-friendly messages
	if (error === 'CredentialsSignin') {
		errorMessage = 'Neplatný email nebo heslo. Zkuste to prosím znovu.';
	} else if (error === 'SessionRequired') {
		errorMessage = 'Pro přístup na tuto stránku musíte být přihlášeni.';
	} else if (error === 'OAuthAccountNotLinked') {
		errorMessage =
			'Pro potvrzení vaší identity se přihlaste stejným účtem, který jste použili původně.';
	} else if (error === 'OAuthSignInFailed') {
		errorMessage =
			'Ověření pomocí sociálního přihlášení selhalo. Zkuste to prosím znovu.';
	} else if (error === 'OAuthCallbackError') {
		errorMessage =
			'Chyba zpětného volání sociálního přihlášení. Zkuste to prosím znovu.';
	} else if (error === 'EmailSignInFailed') {
		errorMessage =
			'Přihlašovací odkaz je neplatný nebo vypršel. Zkuste to prosím znovu.';
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-12">
			<div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
				<div className="space-y-2 text-center">
					<h1 className="text-destructive text-2xl font-bold">Chyba ověření</h1>
					<p className="text-muted-foreground">{errorMessage}</p>
				</div>

				<div className="flex justify-center space-x-4 pt-4">
					<Button asChild variant="outline">
						<Link href="/auth/login">Zpět na přihlášení</Link>
					</Button>
					<Button asChild>
						<Link href="/">Zpět na úvod</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
