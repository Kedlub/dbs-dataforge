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
	title: 'Sports Facilities | ActiveLife',
	description:
		'Browse all available sports facilities at ActiveLife sports center'
};

export default function FacilitiesPage() {
	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
						Sports Facilities
					</h1>
					<p className="text-muted-foreground">
						Browse all available sports facilities at our center
					</p>
				</div>

				<Alert className="bg-blue-50 dark:bg-blue-950/50">
					<CalendarIcon className="h-4 w-4" />
					<AlertTitle>Reservation Instructions</AlertTitle>
					<AlertDescription>
						To make a reservation, click the "Reserve" button next to an active
						facility. You'll be able to select a date, time slot, and activity
						for your reservation.
					</AlertDescription>
				</Alert>

				<Card>
					<CardHeader>
						<CardTitle>Available Facilities</CardTitle>
						<CardDescription>
							View details about our sports facilities, their capacity, and
							current status
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
