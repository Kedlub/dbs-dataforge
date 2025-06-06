'use client';

import { useEffect, useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Define the structure of a facility based on the Prisma model
interface Facility {
	id: string;
	name: string;
	description: string | null;
	capacity: number;
	status: string;
	openingHour: number;
	closingHour: number;
}

export function FacilitiesList() {
	const [facilities, setFacilities] = useState<Facility[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFacilities = async () => {
			try {
				const response = await fetch('/api/facilities');

				if (!response.ok) {
					throw new Error('Failed to fetch facilities');
				}

				const data = await response.json();
				setFacilities(data);
			} catch (err) {
				setError('Chyba při načítání sportovišť. Zkuste to prosím později.');
				console.error('Error fetching facilities:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchFacilities();
	}, []);

	// Helper function to format hours (24h format to 12h format with AM/PM)
	const formatHour = (hour: number) => {
		// const period = hour >= 12 ? 'PM' : 'AM';
		// const displayHour = hour % 12 || 12;
		// return `${displayHour} ${period}`;
		// Format as HH:00 (e.g., 9 -> 09:00, 14 -> 14:00)
		const displayHour = hour.toString().padStart(2, '0');
		return `${displayHour}:00`;
	};

	// Render status badge with appropriate color and icon
	const renderStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'active':
				return (
					<Badge
						variant="default"
						className="flex items-center gap-1 bg-green-600"
					>
						<CheckCircle2 className="h-3.5 w-3.5" />
						<span>Aktivní</span>
					</Badge>
				);
			case 'maintenance':
				return (
					<Badge
						variant="secondary"
						className="flex items-center gap-1 bg-yellow-500 text-black"
					>
						<Clock className="h-3.5 w-3.5" />
						<span>Údržba</span>
					</Badge>
				);
			case 'closed':
				return (
					<Badge variant="destructive" className="flex items-center gap-1">
						<AlertCircle className="h-3.5 w-3.5" />
						<span>Zavřeno</span>
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(5)].map((_, index) => (
					<Card key={index}>
						<CardContent className="p-4">
							<div className="space-y-3">
								<Skeleton className="h-5 w-1/3" />
								<Skeleton className="h-4 w-2/3" />
								<div className="flex gap-4">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-24" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-destructive/15 text-destructive rounded-md p-4">
				<div className="flex items-center gap-2">
					<AlertCircle className="h-4 w-4" />
					<p className="font-medium">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Název sportoviště</TableHead>
						<TableHead>Popis</TableHead>
						<TableHead className="text-center">Kapacita</TableHead>
						<TableHead className="text-center">Otevírací doba</TableHead>
						<TableHead className="text-center">Stav</TableHead>
						<TableHead className="text-center">Akce</TableHead>
						<TableHead className="text-center">Detail</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{facilities.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="h-24 text-center">
								Nenalezena žádná sportoviště
							</TableCell>
						</TableRow>
					) : (
						facilities.map((facility) => (
							<TableRow key={facility.id}>
								<TableCell className="font-medium">{facility.name}</TableCell>
								<TableCell>{facility.description}</TableCell>
								<TableCell className="text-center">
									{facility.capacity}
								</TableCell>
								<TableCell className="text-center">
									{formatHour(facility.openingHour)} -{' '}
									{formatHour(facility.closingHour)}
								</TableCell>
								<TableCell className="text-center">
									{renderStatusBadge(facility.status)}
								</TableCell>
								<TableCell className="text-center">
									{facility.status.toLowerCase() === 'active' ||
									facility.status.toLowerCase() === 'open' ? (
										<Button variant="outline" size="sm" asChild>
											<Link href={`/app/facilities/reserve/${facility.id}`}>
												Rezervovat
											</Link>
										</Button>
									) : (
										<Button variant="outline" size="sm" disabled>
											Rezervovat
										</Button>
									)}
								</TableCell>
								<TableCell className="text-center">
									<Button variant="secondary" size="sm" asChild>
										<Link href={`/app/facilities/${facility.id}`}>
											Zobrazit detail
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
