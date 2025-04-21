'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Facility, Activity, SystemSettings } from '@/lib/types';
import { format, addDays, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Define a type for the available slots state
interface AvailableSlot {
	id: string;
	time: string; // Formatted time (HH:mm)
}

// Define TimeSlot locally if not exported, only needed for API response typing
interface ApiTimeSlot {
	id: string;
	facilityId: string;
	startTime: string | Date;
	endTime: string | Date;
	isAvailable: boolean;
}

export default function ReserveFacilityPage() {
	const router = useRouter();
	const { id } = useParams();
	const [facility, setFacility] = useState<Facility | null>(null);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(
		undefined
	);
	const [selectedActivity, setSelectedActivity] = useState<string | undefined>(
		undefined
	);
	const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableSlot[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [settings, setSettings] = useState<Pick<
		SystemSettings,
		'maxBookingLeadDays'
	> | null>(null);
	const [isLoadingSettings, setIsLoadingSettings] = useState(true);

	// Fetch facility details and settings
	useEffect(() => {
		setIsLoading(true);
		setIsLoadingSettings(true);

		const fetchFacilityAndActivities = async () => {
			try {
				// Fetch facility and its activities
				const [facilityResponse, activitiesResponse] = await Promise.all([
					fetch(`/api/facilities/${id}`),
					fetch(`/api/activities?facilityId=${id}`)
				]);

				if (!facilityResponse.ok) {
					throw new Error('Failed to fetch facility');
				}
				if (!activitiesResponse.ok) {
					throw new Error('Failed to fetch activities');
				}
				const facilityData = await facilityResponse.json();
				const activitiesData = await activitiesResponse.json();
				setFacility(facilityData);
				setActivities(activitiesData);
			} catch (err) {
				setError(
					'Chyba při načítání detailů sportoviště nebo aktivit. Zkuste to prosím později.'
				);
				console.error('Error fetching facility/activities:', err);
			} finally {
				setIsLoading(false); // Facility data loaded (or failed)
			}
		};

		const fetchSettings = async () => {
			try {
				// Fetch from the public endpoint
				const settingsResponse = await fetch('/api/settings/public');
				if (!settingsResponse.ok) {
					throw new Error('Failed to fetch settings');
				}
				const settingsData = await settingsResponse.json();
				setSettings(settingsData);
			} catch (err) {
				console.error('Error fetching settings:', err);
				// Decide how to handle settings error - maybe set default limits?
				setError(
					'Chyba při načítání nastavení systému. Používají se výchozí limity.'
				);
				// Optionally set default settings state here if needed
			} finally {
				setIsLoadingSettings(false);
			}
		};

		fetchFacilityAndActivities();
		fetchSettings();
	}, [id]);

	// When date is selected, fetch available time slots
	useEffect(() => {
		if (selectedDate) {
			fetchAvailableTimeSlots();
		}
		// Reset time slot selection when date changes
		setSelectedSlotId(undefined);
	}, [selectedDate]);

	const fetchAvailableTimeSlots = async () => {
		if (!selectedDate || !id) return;

		try {
			const formattedDate = format(selectedDate, 'yyyy-MM-dd');
			const response = await fetch(
				`/api/time-slots?facilityId=${id}&date=${formattedDate}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch time slots');
			}

			const data: ApiTimeSlot[] = await response.json();

			const availableSlots: AvailableSlot[] = data
				.filter((slot) => slot.isAvailable)
				.map((slot) => ({
					id: slot.id,
					time: format(new Date(slot.startTime), 'HH:mm')
				}));

			setAvailableTimeSlots(availableSlots);
		} catch (err) {
			console.error('Error fetching time slots:', err);
			setAvailableTimeSlots([]);
		}
	};

	const handleSubmit = async () => {
		if (!selectedDate || !selectedSlotId || !selectedActivity) {
			setError(
				'Vyberte prosím datum, časový slot a aktivitu pro vaši rezervaci.'
			);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const reservation = {
				facilityId: id,
				activityId: selectedActivity,
				slotId: selectedSlotId
			};

			const response = await fetch('/api/reservations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(reservation)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Vytvoření rezervace se nezdařilo');
			}

			setSuccess(true);

			// Redirect to reservations page after successful submission
			setTimeout(() => {
				router.push('/app/reservations');
			}, 2000);
		} catch (err: any) {
			setError(err.message || 'Při vytváření vaší rezervace došlo k chybě.');
			console.error('Error creating reservation:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Calculate max date for calendar
	const today = startOfDay(new Date());
	const maxDate = settings
		? addDays(today, settings.maxBookingLeadDays)
		: undefined;

	if (isLoading || isLoadingSettings) {
		return (
			<div className="container flex h-[50vh] items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<Loader2 className="text-primary h-8 w-8 animate-spin" />
					<p>Načítání detailů sportoviště...</p>
				</div>
			</div>
		);
	}

	if (error && !facility) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive">Chyba</CardTitle>
					</CardHeader>
					<CardContent>
						<p>{error}</p>
					</CardContent>
					<CardFooter>
						<Button onClick={() => router.back()}>Zpět</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Card className="border-green-500">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-green-600">
							<CheckCircle2 className="h-5 w-5" />
							Rezervace byla úspěšná
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p>
							Vaše rezervace byla úspěšně vytvořena! Přesměrování na vaše
							rezervace...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
						Rezervace sportoviště
					</h1>
					<p className="text-muted-foreground">
						Vytvořit novou rezervaci pro {facility?.name}
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{facility?.name}</CardTitle>
						<CardDescription>{facility?.description}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							{error && (
								<div className="bg-destructive/15 text-destructive rounded-md p-4">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="date">Datum</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												'w-full justify-start text-left font-normal',
												!selectedDate && 'text-muted-foreground'
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{selectedDate ? (
												format(selectedDate, 'PPP')
											) : (
												<span>Vyberte datum</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={selectedDate}
											onSelect={setSelectedDate}
											disabled={[
												(date: Date) => date < today, // Disable past dates
												...(maxDate ? [(date: Date) => date > maxDate] : []) // Disable dates beyond lead days if maxDate is set
											]}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-2">
								<Label htmlFor="time">Časový slot</Label>
								<Select
									value={selectedSlotId}
									onValueChange={setSelectedSlotId}
									disabled={!selectedDate || availableTimeSlots.length === 0}
								>
									<SelectTrigger id="time" className="w-full">
										<SelectValue placeholder="Vyberte čas" />
									</SelectTrigger>
									<SelectContent>
										{availableTimeSlots.length > 0 ? (
											availableTimeSlots.map((slot) => (
												<SelectItem key={slot.id} value={slot.id}>
													{slot.time}
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>
												{selectedDate
													? 'Pro tento den nejsou k dispozici žádné sloty'
													: 'Nejprve vyberte datum'}
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="activity">Aktivita</Label>
								<Select
									value={selectedActivity}
									onValueChange={setSelectedActivity}
									disabled={activities.length === 0}
								>
									<SelectTrigger id="activity" className="w-full">
										<SelectValue placeholder="Vyberte aktivitu" />
									</SelectTrigger>
									<SelectContent>
										{activities.length > 0 ? (
											activities.map((activity) => (
												<SelectItem key={activity.id} value={activity.id}>
													{activity.name} - {activity.price}
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>
												Žádné aktivity nejsou k dispozici
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => router.back()}>
							Zrušit
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={
								!selectedDate ||
								!selectedSlotId ||
								!selectedActivity ||
								isSubmitting
							}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Vytváření...
								</>
							) : (
								'Vytvořit rezervaci'
							)}
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
