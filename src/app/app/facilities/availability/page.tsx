import { Metadata } from 'next';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { AvailabilityChecker } from '@/components/facilities/availability-checker';

export const metadata: Metadata = {
	title: 'Dostupnost sportovišť | ActiveLife',
	description:
		'Zkontrolujte aktuální dostupnost sportovišť v sportovním centru ActiveLife'
};

export default function FacilityAvailabilityPage() {
	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
						Dostupnost sportovišť
					</h1>
					<p className="text-muted-foreground">
						Zkontrolujte aktuální dostupnost našich sportovišť pro vybraný den
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Kontrola dostupnosti</CardTitle>
						<CardDescription>
							Vyberte datum a prohlédněte si souhrn dostupnosti pro aktivní
							sportoviště
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AvailabilityChecker />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
