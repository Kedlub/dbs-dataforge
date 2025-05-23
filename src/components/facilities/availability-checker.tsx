'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Import format from date-fns

import { AlertCircle } from 'lucide-react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerSingle } from '@/components/ui/date-picker-single'; // Import the new component

interface FacilityAvailability {
	facilityId: string;
	facilityName: string;
	summary: string;
}

export function AvailabilityChecker() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date()
	);
	const [availabilityData, setAvailabilityData] = useState<
		FacilityAvailability[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!selectedDate) return;

		const fetchAvailability = async () => {
			setLoading(true);
			setError(null);
			try {
				const dateString = format(selectedDate, 'yyyy-MM-dd');
				const response = await fetch(
					`/api/facilities/availability?date=${dateString}`
				);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || 'Nepodařilo se načíst data o dostupnosti'
					);
				}
				const data: FacilityAvailability[] = await response.json();
				setAvailabilityData(data);
			} catch (err: any) {
				setError(
					err.message ||
						'Chyba při načítání dostupnosti. Zkuste to prosím později.'
				);
				console.error('Error fetching facility availability:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchAvailability();
	}, [selectedDate]);

	return (
		<div className="space-y-6">
			<div>
				<label
					htmlFor="availability-date"
					className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Vyberte datum
				</label>
				<DatePickerSingle date={selectedDate} setDate={setSelectedDate} />
			</div>

			{error && (
				<div className="bg-destructive/15 text-destructive rounded-md p-4">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4" />
						<p className="font-medium">{error}</p>
					</div>
				</div>
			)}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Sportoviště</TableHead>
							<TableHead>Souhrn dostupnosti</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							[...Array(3)].map((_, index) => (
								<TableRow key={index}>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-full" />
									</TableCell>
								</TableRow>
							))
						) : availabilityData.length === 0 && !error ? (
							<TableRow>
								<TableCell colSpan={2} className="h-24 text-center">
									Pro vybrané datum nejsou k dispozici žádná aktivní sportoviště
									nebo data dostupnosti.
								</TableCell>
							</TableRow>
						) : (
							availabilityData.map((item) => (
								<TableRow key={item.facilityId}>
									<TableCell className="font-medium">
										{item.facilityName}
									</TableCell>
									<TableCell>{item.summary}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
