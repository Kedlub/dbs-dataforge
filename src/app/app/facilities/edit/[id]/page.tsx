'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FacilityForm } from '@/components/facilities/facility-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Facility } from '@/lib/types';
import { AlertCircle } from 'lucide-react';

export default function EditFacilityPage() {
	const params = useParams();
	const id = params.id as string;
	const [facility, setFacility] = useState<Facility | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) {
			setError('Chybějící ID sportoviště.');
			setLoading(false);
			return;
		}

		async function fetchFacility() {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(`/api/facilities/${id}`);
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Sportoviště nebylo nalezeno.');
					} else {
						throw new Error('Nepodařilo se načíst data sportoviště.');
					}
				}
				const data: Facility = await response.json();
				setFacility(data);
			} catch (err: any) {
				setError(err.message || 'Nastala chyba při načítání sportoviště.');
			} finally {
				setLoading(false);
			}
		}

		fetchFacility();
	}, [id]);

	if (loading) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Card className="mx-auto max-w-2xl">
					<CardHeader>
						<Skeleton className="h-6 w-1/2" />
					</CardHeader>
					<CardContent className="space-y-8">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-10 w-1/2" />
						<Skeleton className="h-10 w-1/2" />
						<Skeleton className="h-10 w-1/2" />
						<Skeleton className="h-10 w-1/3" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Alert variant="destructive" className="mx-auto max-w-2xl">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Chyba</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!facility) {
		// This case should ideally be covered by the error state from fetch
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Alert className="mx-auto max-w-2xl">
					<AlertTitle>Nenalezeno</AlertTitle>
					<AlertDescription>Sportoviště nebylo nalezeno.</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<Card className="mx-auto max-w-2xl">
				<CardHeader>
					<CardTitle>Upravit sportoviště: {facility.name}</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Pass fetched data to the form */}
					<FacilityForm initialData={facility} />
				</CardContent>
			</Card>
		</div>
	);
}
