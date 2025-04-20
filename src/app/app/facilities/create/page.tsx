'use client';

import { FacilityForm } from '@/components/facilities/facility-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateFacilityPage() {
	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<Card className="mx-auto max-w-2xl">
				<CardHeader>
					<CardTitle>Vytvořit nové sportoviště</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Use the reusable form component */}
					<FacilityForm />
				</CardContent>
			</Card>
		</div>
	);
}
