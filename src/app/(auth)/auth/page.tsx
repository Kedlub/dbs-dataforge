import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

export default async function AuthPage() {
	const session = await getAuthSession();

	// If user is authenticated, redirect to app instead of login
	if (session?.user) {
		redirect('/app');
	}

	// Otherwise, redirect to login
	redirect('/auth/login');
}
