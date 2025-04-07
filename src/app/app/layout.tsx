import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { getAuthSession } from '@/lib/auth';

export default async function AppLayout({
	children
}: {
	children: React.ReactNode;
}) {
	// Check if user is authenticated
	const session = await getAuthSession();

	if (!session?.user) {
		redirect('/auth/login?callbackUrl=/app');
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex-1 overflow-auto p-4 md:p-6">
				<SidebarTrigger />
				{children}
			</main>
		</SidebarProvider>
	);
}
