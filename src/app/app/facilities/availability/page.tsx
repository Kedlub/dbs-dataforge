import { Metadata } from 'next';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';

export const metadata: Metadata = {
	title: 'Facility Availability | ActiveLife',
	description:
		'Check the current availability of sports facilities at ActiveLife sports center'
};

export default function FacilityAvailabilityPage() {
	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
						Facility Availability
					</h1>
					<p className="text-muted-foreground">
						Check the current availability of our sports facilities
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Real-time Availability</CardTitle>
						<CardDescription>
							View which facilities are currently available and their upcoming
							schedule
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Availability calendar or schedule component will go here */}
						<p>Coming soon: Real-time availability checker</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
