'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale'; // Import Czech locale
import { toast } from 'sonner';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerSingle } from '@/components/ui/date-picker-single';
import { cn } from '@/lib/utils';
import { UserSearchResult, Facility, Activity, TimeSlot } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';

// Zod schema mirroring the backend validation, but adapted for form steps
const formSchema = z.object({
	// User selection/creation
	userSearch: z.string().optional(),
	selectedUserId: z.string().uuid().optional(),
	firstName: z.string().min(1, 'Jméno je povinné'),
	lastName: z.string().min(1, 'Příjmení je povinné'),
	email: z.string().email('Neplatný email'),
	phone: z
		.string()
		.regex(/^\+?[1-9]\d{1,14}$/, 'Neplatné tel. číslo')
		.optional()
		.or(z.literal('')), // Allow empty string

	// Reservation details
	facilityId: z.string().uuid('Vyberte sportoviště'),
	activityId: z.string().uuid('Vyberte aktivitu'),
	selectedDate: z.date({ required_error: 'Vyberte datum' }),
	slotId: z.string().uuid('Vyberte časový slot'),
	internalNotes: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface ManualReservationDialogProps {
	onSuccess?: () => void; // Callback after successful creation
}

export function ManualReservationDialog({
	onSuccess
}: ManualReservationDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSearchingUsers, setIsSearchingUsers] = useState(false);
	const [userSearchResults, setUserSearchResults] = useState<
		UserSearchResult[]
	>([]);
	const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
	const [facilities, setFacilities] = useState<Facility[]>([]);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
	const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
	const [isLoadingActivities, setIsLoadingActivities] = useState(false);
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		reset,
		formState: { errors }
	} = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			internalNotes: '',
			userSearch: '',
			selectedUserId: undefined,
			facilityId: undefined,
			activityId: undefined,
			selectedDate: undefined,
			slotId: undefined
		}
	});

	// Get the value using watch for debouncing
	const userSearchTerm = watch('userSearch');
	const selectedUserId = watch('selectedUserId');
	const selectedFacilityId = watch('facilityId');
	const selectedActivityId = watch('activityId');
	const selectedDate = watch('selectedDate');

	const debouncedUserSearchTerm = useDebounce(userSearchTerm, 500);

	// --- Data Fetching Effects ---

	// Fetch users based on search term
	useEffect(() => {
		if (debouncedUserSearchTerm && debouncedUserSearchTerm.length >= 2) {
			const searchUsers = async () => {
				setIsSearchingUsers(true);
				try {
					const response = await fetch(
						`/api/users/search?query=${encodeURIComponent(debouncedUserSearchTerm)}`
					);
					if (!response.ok) throw new Error('Failed to fetch users');
					const data: UserSearchResult[] = await response.json();
					setUserSearchResults(data);
					setIsUserSearchOpen(data.length > 0);
				} catch (error) {
					console.error(error);
					toast.error('Nepodařilo se vyhledat uživatele.');
					setUserSearchResults([]);
					setIsUserSearchOpen(false);
				} finally {
					setIsSearchingUsers(false);
				}
			};
			searchUsers();
		} else {
			setUserSearchResults([]);
			setIsUserSearchOpen(false);
		}
	}, [debouncedUserSearchTerm]);

	// Fetch facilities on component mount
	useEffect(() => {
		const fetchFacilities = async () => {
			setIsLoadingFacilities(true);
			try {
				// Assuming an endpoint exists to fetch all facilities
				const response = await fetch('/api/facilities');
				if (!response.ok) throw new Error('Failed to fetch facilities');
				const data: Facility[] = await response.json();
				setFacilities(data);
			} catch (error) {
				console.error(error);
				toast.error('Nepodařilo se načíst sportoviště.');
			} finally {
				setIsLoadingFacilities(false);
			}
		};
		fetchFacilities();
	}, []);

	// Fetch activities when a facility is selected
	useEffect(() => {
		setTimeSlots([]); // Reset slots when facility changes
		setValue('activityId', '');
		setValue('slotId', '');
		if (selectedFacilityId) {
			const fetchActivities = async () => {
				setIsLoadingActivities(true);
				try {
					// Correct the endpoint URL to use query parameter
					const response = await fetch(
						`/api/activities?facilityId=${selectedFacilityId}`
					);
					if (!response.ok) throw new Error('Failed to fetch activities');
					const data: Activity[] = await response.json();
					setActivities(data);
				} catch (error) {
					console.error(error);
					toast.error('Nepodařilo se načíst aktivity.');
					setActivities([]);
				} finally {
					setIsLoadingActivities(false);
				}
			};
			fetchActivities();
		} else {
			setActivities([]);
		}
	}, [selectedFacilityId, setValue]);

	// Fetch available time slots when facility, activity, and date are selected
	useEffect(() => {
		setValue('slotId', '');
		if (selectedFacilityId && selectedActivityId && selectedDate) {
			const fetchSlots = async () => {
				setIsLoadingSlots(true);
				const formattedDate = format(selectedDate, 'yyyy-MM-dd');
				try {
					const response = await fetch(
						`/api/timeslots/available?facilityId=${selectedFacilityId}&activityId=${selectedActivityId}&date=${formattedDate}`
					);
					if (!response.ok) throw new Error('Failed to fetch time slots');
					const data: TimeSlot[] = await response.json();
					setTimeSlots(data);
				} catch (error) {
					console.error(error);
					toast.error('Nepodařilo se načíst časové sloty.');
					setTimeSlots([]);
				} finally {
					setIsLoadingSlots(false);
				}
			};
			fetchSlots();
		} else {
			setTimeSlots([]);
		}
	}, [selectedFacilityId, selectedActivityId, selectedDate, setValue]);

	// --- Event Handlers ---

	const handleUserSelect = (user: UserSearchResult) => {
		setValue('selectedUserId', user.id);
		setValue('firstName', user.firstName);
		setValue('lastName', user.lastName);
		setValue('email', user.email);
		setValue('phone', user.phone || '');
		setValue(
			'userSearch',
			`${user.firstName} ${user.lastName} (${user.email})`
		);
		setUserSearchResults([]); // Clear search results
		setIsUserSearchOpen(false); // Close popover
	};

	const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue('userSearch', e.target.value);
		// Keep popover open while typing if results are available
		if (userSearchResults.length > 0) {
			setIsUserSearchOpen(true);
		}
		// If user clears search or modifies selection, reset user details
		if (
			!e.target.value ||
			!userSearchResults.some(
				(u) => `${u.firstName} ${u.lastName} (${u.email})` === e.target.value
			)
		) {
			setValue('selectedUserId', undefined);
			// Check if the input still has focus before resetting these,
			// might interfere if user is selecting from dropdown
			// This part might need refinement based on exact behavior needed.
			// For now, let's reset if the value is empty
			if (!e.target.value) {
				setValue('firstName', '');
				setValue('lastName', '');
				setValue('email', '');
				setValue('phone', '');
				setIsUserSearchOpen(false); // Close if cleared
			}
		}
	};

	const handleSearchFocus = () => {
		if (userSearchResults.length > 0) {
			setIsUserSearchOpen(true);
		}
	};

	const handleSearchBlur = () => {
		// Small delay to allow click inside popover
		setTimeout(() => {
			setIsUserSearchOpen(false);
		}, 150);
	};

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);
		try {
			const payload = {
				userId: data.selectedUserId,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone || undefined,
				activityId: data.activityId,
				slotId: data.slotId,
				internalNotes: data.internalNotes || undefined
			};

			const response = await fetch('/api/reservations/manual', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create reservation');
			}

			toast.success('Rezervace byla úspěšně vytvořena.');
			setIsOpen(false);
			reset({
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				internalNotes: '',
				userSearch: '',
				selectedUserId: undefined,
				facilityId: '',
				activityId: '',
				selectedDate: undefined,
				slotId: ''
			});
			setUserSearchResults([]);
			setActivities([]);
		} catch (error: any) {
			console.error('Error creating manual reservation:', error);
			toast.error(`Chyba při vytváření rezervace: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button>Nová manuální rezervace</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Vytvořit manuální rezervaci</DialogTitle>
					<DialogDescription>
						Vyhledejte existujícího uživatele nebo zadejte údaje nového
						uživatele a vyberte detaily rezervace.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
					{/* User Search and Details */}
					<div className="space-y-2">
						<Label htmlFor="userSearch">Vyhledat uživatele</Label>
						<Popover open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
							<PopoverTrigger asChild>
								<div className="relative">
									<Input
										id="userSearch"
										{...register('userSearch')}
										placeholder="Jméno, email, telefon..."
										autoComplete="off"
										onChange={handleUserSearchChange}
										onFocus={handleSearchFocus}
										onBlur={handleSearchBlur}
									/>
									{isSearchingUsers && (
										<Loader2 className="text-muted-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 animate-spin" />
									)}
								</div>
							</PopoverTrigger>
							{isUserSearchOpen && (
								<PopoverContent
									className="w-[--radix-popover-trigger-width] p-0"
									onOpenAutoFocus={(e) => e.preventDefault()}
								>
									<div className="max-h-60 overflow-y-auto text-sm">
										{isSearchingUsers && (
											<div className="text-muted-foreground p-4 text-center">
												Načítání...
											</div>
										)}
										{!isSearchingUsers && userSearchResults.length === 0 && (
											<div className="text-muted-foreground p-4 text-center">
												Nenalezen žádný uživatel.
											</div>
										)}
										{!isSearchingUsers &&
											userSearchResults.map((user) => (
												<Button
													key={user.id}
													variant="ghost"
													className="h-auto w-full justify-start rounded-none p-2 font-normal"
													onClick={() => handleUserSelect(user)}
												>
													{user.firstName} {user.lastName} ({user.email})
												</Button>
											))}
									</div>
								</PopoverContent>
							)}
						</Popover>
						{errors.userSearch && (
							<p className="text-sm text-red-500">
								{errors.userSearch.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">Jméno*</Label>
							<Input
								id="firstName"
								{...register('firstName')}
								disabled={!!selectedUserId}
							/>
							{errors.firstName && (
								<p className="text-sm text-red-500">
									{errors.firstName.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Příjmení*</Label>
							<Input
								id="lastName"
								{...register('lastName')}
								disabled={!!selectedUserId}
							/>
							{errors.lastName && (
								<p className="text-sm text-red-500">
									{errors.lastName.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email*</Label>
							<Input
								id="email"
								type="email"
								{...register('email')}
								disabled={!!selectedUserId}
							/>
							{errors.email && (
								<p className="text-sm text-red-500">{errors.email.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Telefon</Label>
							<Input
								id="phone"
								type="tel"
								{...register('phone')}
								disabled={!!selectedUserId}
							/>
							{errors.phone && (
								<p className="text-sm text-red-500">{errors.phone.message}</p>
							)}
						</div>
					</div>

					<hr />

					{/* Reservation Details */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="facilityId">Sportoviště*</Label>
							<Controller
								name="facilityId"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={isLoadingFacilities}
									>
										<SelectTrigger>
											<SelectValue placeholder="Vyberte sportoviště..." />
										</SelectTrigger>
										<SelectContent>
											{isLoadingFacilities ? (
												<SelectItem value="loading" disabled>
													Načítání...
												</SelectItem>
											) : (
												facilities.map((facility) => (
													<SelectItem key={facility.id} value={facility.id}>
														{facility.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.facilityId && (
								<p className="text-sm text-red-500">
									{errors.facilityId.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="activityId">Aktivita*</Label>
							<Controller
								name="activityId"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={!selectedFacilityId || isLoadingActivities}
									>
										<SelectTrigger>
											<SelectValue placeholder="Vyberte aktivitu..." />
										</SelectTrigger>
										<SelectContent>
											{isLoadingActivities ? (
												<SelectItem value="loading" disabled>
													Načítání...
												</SelectItem>
											) : (
												activities.map((activity) => (
													<SelectItem key={activity.id} value={activity.id}>
														{activity.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.activityId && (
								<p className="text-sm text-red-500">
									{errors.activityId.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="selectedDate">Datum*</Label>
							<Controller
								name="selectedDate"
								control={control}
								render={({ field }) => (
									<DatePickerSingle
										date={field.value}
										setDate={field.onChange}
										disabled={!selectedActivityId}
									/>
								)}
							/>
							{errors.selectedDate && (
								<p className="text-sm text-red-500">
									{errors.selectedDate.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="slotId">Časový slot*</Label>
							<Controller
								name="slotId"
								control={control}
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={
											!selectedDate || isLoadingSlots || timeSlots.length === 0
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Vyberte čas..." />
										</SelectTrigger>
										<SelectContent>
											{isLoadingSlots ? (
												<SelectItem value="loading" disabled>
													Načítání...
												</SelectItem>
											) : timeSlots.length === 0 && selectedDate ? (
												<SelectItem value="no-slots" disabled>
													Žádné volné sloty.
												</SelectItem>
											) : (
												timeSlots.map((slot) => (
													<SelectItem key={slot.id} value={slot.id}>
														{format(new Date(slot.startTime), 'HH:mm')} -
														{format(new Date(slot.endTime), 'HH:mm')}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.slotId && (
								<p className="text-sm text-red-500">{errors.slotId.message}</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="internalNotes">Interní poznámky</Label>
						<Textarea
							id="internalNotes"
							{...register('internalNotes')}
							placeholder="Volitelné poznámky pro zaměstnance..."
						/>
						{errors.internalNotes && (
							<p className="text-sm text-red-500">
								{errors.internalNotes.message}
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
							disabled={isSubmitting}
						>
							Zrušit
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Vytvořit rezervaci
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
