'use client';

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
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function FacilitiesPage() {
	const { data: session } = useSession();

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
							Sportoviště
						</h1>
						<p className="text-muted-foreground">
							Prohlížejte všechna dostupná sportoviště v našem centru
						</p>
					</div>
					{session?.user?.role === 'ADMIN' && (
						<Link href="/app/facilities/create" passHref>
							<Button variant="outline">
								<PlusCircle className="mr-2 h-4 w-4" />
								Vytvořit sportoviště
							</Button>
						</Link>
					)}
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
