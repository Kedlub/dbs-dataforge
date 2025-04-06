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
import { Facility, Activity } from '@/lib/types';
import { format } from 'date-fns';
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

export default function ReserveFacilityPage() {
	const router = useRouter();
	const { id } = useParams();
	const [facility, setFacility] = useState<Facility | null>(null);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTime, setSelectedTime] = useState<string | undefined>(
		undefined
	);
	const [selectedActivity, setSelectedActivity] = useState<string | undefined>(
		undefined
	);
	const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Fetch facility details
	useEffect(() => {
		const fetchFacility = async () => {
			try {
				const response = await fetch(`/api/facilities/${id}`);

				if (!response.ok) {
					throw new Error('Failed to fetch facility');
				}

				const data = await response.json();
				setFacility(data);
			} catch (err) {
				setError('Error loading facility details. Please try again later.');
				console.error('Error fetching facility:', err);
			} finally {
				setIsLoading(false);
			}
		};

		const fetchActivities = async () => {
			try {
				const response = await fetch(`/api/activities?facilityId=${id}`);

				if (!response.ok) {
					throw new Error('Failed to fetch activities');
				}

				const data = await response.json();
				setActivities(data);
			} catch (err) {
				console.error('Error fetching activities:', err);
			}
		};

		fetchFacility();
		fetchActivities();
	}, [id]);

	// When date is selected, fetch available time slots
	useEffect(() => {
		if (selectedDate) {
			fetchAvailableTimeSlots();
		}

		// Reset time when date changes
		setSelectedTime(undefined);
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

			const data = await response.json();

			// Extract available times from the slots
			const availableTimes = data
				.filter((slot: any) => slot.isAvailable)
				.map((slot: any) => format(new Date(slot.startTime), 'HH:mm'));

			setAvailableTimeSlots(availableTimes);
		} catch (err) {
			console.error('Error fetching time slots:', err);
			setAvailableTimeSlots([]);
		}
	};

	const handleSubmit = async () => {
		if (!selectedDate || !selectedTime || !selectedActivity) {
			setError(
				'Please select a date, time, and activity for your reservation.'
			);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// Combine date and time
			const reservationDateTime = new Date(selectedDate);
			const [hours, minutes] = selectedTime.split(':').map(Number);
			reservationDateTime.setHours(hours, minutes, 0, 0);

			const reservation = {
				facilityId: id,
				activityId: selectedActivity,
				startTime: reservationDateTime.toISOString()
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
				throw new Error(data.error || 'Failed to create reservation');
			}

			setSuccess(true);

			// Redirect to reservations page after successful submission
			setTimeout(() => {
				router.push('/app/reservations');
			}, 2000);
		} catch (err: any) {
			setError(
				err.message || 'An error occurred while creating your reservation.'
			);
			console.error('Error creating reservation:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="container flex h-[50vh] items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<Loader2 className="text-primary h-8 w-8 animate-spin" />
					<p>Loading facility details...</p>
				</div>
			</div>
		);
	}

	if (error && !facility) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p>{error}</p>
					</CardContent>
					<CardFooter>
						<Button onClick={() => router.back()}>Go Back</Button>
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
							Reservation Successful
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p>
							Your reservation has been created successfully! Redirecting to
							your reservations...
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
						Reserve Facility
					</h1>
					<p className="text-muted-foreground">
						Create a new reservation for {facility?.name}
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
								<Label htmlFor="date">Date</Label>
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
												<span>Select date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={selectedDate}
											onSelect={setSelectedDate}
											disabled={(date: Date) => {
												// Disable past dates
												return date < new Date(new Date().setHours(0, 0, 0, 0));
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-2">
								<Label htmlFor="time">Time Slot</Label>
								<Select
									value={selectedTime}
									onValueChange={setSelectedTime}
									disabled={!selectedDate || availableTimeSlots.length === 0}
								>
									<SelectTrigger id="time" className="w-full">
										<SelectValue placeholder="Select time" />
									</SelectTrigger>
									<SelectContent>
										{availableTimeSlots.length > 0 ? (
											availableTimeSlots.map((time) => (
												<SelectItem key={time} value={time}>
													{time}
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>
												{selectedDate
													? 'No available slots for this date'
													: 'Select a date first'}
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="activity">Activity</Label>
								<Select
									value={selectedActivity}
									onValueChange={setSelectedActivity}
									disabled={activities.length === 0}
								>
									<SelectTrigger id="activity" className="w-full">
										<SelectValue placeholder="Select activity" />
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
												No activities available
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => router.back()}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={
								!selectedDate ||
								!selectedTime ||
								!selectedActivity ||
								isSubmitting
							}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								'Create Reservation'
							)}
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
