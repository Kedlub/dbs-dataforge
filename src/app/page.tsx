import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
	const session = await getAuthSession();

	// Redirect authenticated users to app dashboard
	if (session?.user) {
		redirect('/app');
	}

	return (
		<div className="flex min-h-screen flex-col">
			<header className="border-border w-full border-b px-4 py-3">
				<div className="container mx-auto flex items-center justify-between">
					<h1 className="text-2xl font-bold">ActiveLife Sports Center</h1>
					<div className="flex space-x-2">
						<Button asChild variant="outline">
							<Link href="/auth/login">Sign In</Link>
						</Button>
						<Button asChild>
							<Link href="/auth/register">Create Account</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center">
				<div className="container mx-auto px-4 text-center">
					<h1 className="text-4xl font-bold sm:text-5xl">
						Welcome to ActiveLife Sports Center
					</h1>
					<p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-xl">
						Join our community and easily book your favorite sports activities.
						Sign in or create an account to get started.
					</p>
					<div className="mt-8 flex justify-center space-x-4">
						<Button asChild size="lg">
							<Link href="/auth/login">Sign In</Link>
						</Button>
						<Button asChild variant="outline" size="lg">
							<Link href="/auth/register">Create Account</Link>
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
