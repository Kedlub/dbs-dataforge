import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/settings-form';
import { Metadata } from 'next';
import { getSystemSettings } from '@/lib/settings';

export const metadata: Metadata = {
	title: 'Nastavení systému',
	description: 'Správa globálních nastavení aplikace.'
};

export default async function SettingsPage() {
	// Ensure only admin can access this page server-side
	const session = await requireAuth(['ADMIN']);
	if (!session) {
		redirect('/auth/login'); // Should be handled by layout/middleware ideally, but double-check
	}

	const settings = await getSystemSettings();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-lg font-medium">Nastavení Systému</h1>
				<p className="text-muted-foreground text-sm">
					Spravujte globální nastavení pro celou aplikaci ActiveLife.
				</p>
			</div>
			<SettingsForm initialData={settings} />
		</div>
	);
}
