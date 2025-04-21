import { FacilityForm } from '@/components/facilities/facility-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSystemSettings } from '@/lib/settings';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Make the component async to fetch settings
export default async function CreateFacilityPage() {
	// Ensure only admin can access this page server-side
	const session = await requireAuth(['ADMIN']);
	if (!session) {
		redirect('/auth/login');
	}

	const settings = await getSystemSettings();

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<Card className="mx-auto max-w-2xl">
				<CardHeader>
					<CardTitle>Vytvořit nové sportoviště</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Pass default hours from settings */}
					<FacilityForm
						defaultOpeningHour={settings.defaultOpeningHour}
						defaultClosingHour={settings.defaultClosingHour}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
