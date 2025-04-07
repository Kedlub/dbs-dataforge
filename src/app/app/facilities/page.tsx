import { Metadata } from 'next';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { FacilitiesList } from '@/components/facilities/facilities-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Sportoviště | ActiveLife',
	description:
		'Prohlížejte všechna dostupná sportoviště v sportovním centru ActiveLife'
};

export default function FacilitiesPage() {
	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
						Sportoviště
					</h1>
					<p className="text-muted-foreground">
						Prohlížejte všechna dostupná sportoviště v našem centru
					</p>
				</div>

				<Alert className="bg-blue-50 dark:bg-blue-950/50">
					<CalendarIcon className="h-4 w-4" />
					<AlertTitle>Pokyny k rezervaci</AlertTitle>
					<AlertDescription>
						Pro vytvoření rezervace klikněte na tlačítko "Rezervovat" u
						aktivního sportoviště. Poté budete moci vybrat datum, časový slot a
						aktivitu pro svou rezervaci.
					</AlertDescription>
				</Alert>

				<Card>
					<CardHeader>
						<CardTitle>Dostupná sportoviště</CardTitle>
						<CardDescription>
							Prohlédněte si detaily o našich sportovištích, jejich kapacitě a
							aktuálním stavu
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FacilitiesList />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
