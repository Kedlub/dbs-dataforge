'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Facility, Activity } from '@/lib/types';
import { fetcher } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

// Assuming status is stored as string in DB
type FacilityStatusString = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

const facilityFormSchema = z
	.object({
		name: z.string().min(3, {
			message: 'Název musí mít alespoň 3 znaky.'
		}),
		description: z.string().optional(),
		capacity: z.coerce
			.number()
			.int()
			.positive({ message: 'Kapacita musí být kladné číslo.' }),
		status: z.enum([
			'ACTIVE',
			'MAINTENANCE',
			'CLOSED'
		]) satisfies z.ZodType<FacilityStatusString>,
		// Keep opening/closing hours as number (0-23) for internal logic, convert in UI
		openingHour: z.coerce
			.number()
			.int()
			.min(0)
			.max(23, 'Otevírací hodina musí být mezi 0 a 23.'),
		closingHour: z.coerce
			.number()
			.int()
			.min(0)
			.max(23, 'Zavírací hodina musí být mezi 0 a 23.'),
		imageUrl: z // Renamed from image_url for consistency with type
			.string()
			.url({ message: 'Neplatná URL adresa obrázku.' })
			.optional()
			.or(z.literal('')),
		activityIds: z.array(z.string().uuid()).optional() // Add activityIds to schema
	})
	.refine((data) => data.closingHour > data.openingHour, {
		message: 'Zavírací hodina musí být pozdější než otevírací hodina.',
		path: ['closingHour'] // path of error
	});

type FacilityFormValues = z.infer<typeof facilityFormSchema>;

// Map Czech status names to string values
const statusOptions: { value: FacilityStatusString; label: string }[] = [
	{ value: 'ACTIVE', label: 'Aktivní' },
	{ value: 'MAINTENANCE', label: 'V údržbě' },
	{ value: 'CLOSED', label: 'Uzavřeno' }
];

// Helper to format number hour (0-23) to HH:MM string
const formatHourToInput = (hour: number): string => {
	return hour.toString().padStart(2, '0') + ':00';
};

// Helper to parse HH:MM string to number hour (0-23)
const parseInputToHour = (timeString: string): number => {
	return parseInt(timeString.split(':')[0], 10);
};

interface FacilityFormProps {
	initialData?: Facility & { activities?: { activityId: string }[] }; // For edit mode
	defaultOpeningHour?: number; // Add default for create mode
	defaultClosingHour?: number; // Add default for create mode
}

export function FacilityForm({
	initialData,
	defaultOpeningHour,
	defaultClosingHour
}: FacilityFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
	const isEditMode = !!initialData;

	// Fetch all active activities
	const {
		data: allActivities,
		error: activitiesError,
		isLoading: isLoadingActivities
	} = useSWR<Activity[]>('/api/activities', fetcher);

	const form = useForm<FacilityFormValues>({
		resolver: zodResolver(facilityFormSchema),
		defaultValues: isEditMode
			? {
					name: initialData?.name ?? '',
					description: initialData?.description ?? '',
					capacity: initialData?.capacity ?? 1,
					status: (initialData?.status?.toUpperCase() ??
						'ACTIVE') as FacilityStatusString,
					openingHour: initialData?.openingHour ?? 8, // Fallback if somehow missing
					closingHour: initialData?.closingHour ?? 22, // Fallback if somehow missing
					imageUrl: initialData?.imageUrl ?? '',
					activityIds: initialData?.activities?.map((a) => a.activityId) ?? []
				}
			: {
					name: '',
					description: '',
					capacity: 1,
					status: 'ACTIVE',
					openingHour: defaultOpeningHour ?? 8, // Use prop or fallback
					closingHour: defaultClosingHour ?? 22, // Use prop or fallback
					imageUrl: '',
					activityIds: []
				}
	});

	// Pre-fill form and selected activities if in edit mode (Effect now mainly handles activities)
	useEffect(() => {
		if (isEditMode && initialData) {
			setSelectedActivityIds(
				initialData.activities?.map((a) => a.activityId) || []
			);
		} else if (!isEditMode) {
			setSelectedActivityIds([]);
			form.reset({
				name: '',
				description: '',
				capacity: 1,
				status: 'ACTIVE',
				openingHour: defaultOpeningHour ?? 8,
				closingHour: defaultClosingHour ?? 22,
				imageUrl: '',
				activityIds: []
			});
		}
	}, [initialData, isEditMode, form, defaultOpeningHour, defaultClosingHour]);

	// Handle checkbox changes
	const handleActivityCheckChange = (
		activityId: string,
		checked: boolean | string
	) => {
		const currentIds = new Set(selectedActivityIds);
		if (checked) {
			currentIds.add(activityId);
		} else {
			currentIds.delete(activityId);
		}
		const newIds = Array.from(currentIds);
		setSelectedActivityIds(newIds);
		form.setValue('activityIds', newIds, { shouldValidate: true }); // Update form value
	};

	async function onSubmit(data: FacilityFormValues) {
		setIsLoading(true);
		try {
			const method = isEditMode ? 'PUT' : 'POST';
			const url = isEditMode
				? `/api/facilities/${initialData?.id}`
				: '/api/facilities';

			// Prepare data for API (potentially transform fields if needed)
			const apiData = {
				...data,
				imageUrl: data.imageUrl || null,
				activityIds: selectedActivityIds // Use state value for submission
			};

			console.log('Submitting Facility Data:', apiData);
			const response = await fetch(url, {
				method: method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(apiData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || // Prefer backend error message
						(isEditMode
							? 'Nepodařilo se aktualizovat sportoviště.'
							: 'Nepodařilo se vytvořit sportoviště.')
				);
			}

			toast.success(
				isEditMode
					? 'Sportoviště bylo úspěšně aktualizováno.'
					: 'Sportoviště bylo úspěšně vytvořeno.'
			);
			// Redirect to the detail page after edit, or list page after create
			if (isEditMode) {
				// Maybe just refresh data instead of full redirect?
				router.refresh();
			} else {
				router.push('/app/facilities');
				router.refresh();
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Neznámá chyba';
			toast.error(
				`Chyba při ${isEditMode ? 'aktualizaci' : 'vytváření'} sportoviště: ${errorMessage}`
			);
			console.error('Facility form error:', error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Název sportoviště</FormLabel>
							<FormControl>
								<Input placeholder="Např. Tenisový kurt 1" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Popis</FormLabel>
							<FormControl>
								<Textarea placeholder="Popis sportoviště..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="capacity"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Kapacita</FormLabel>
							<FormControl>
								<Input type="number" min="1" {...field} />
							</FormControl>
							<FormDescription>Maximální počet osob.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Stav</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Vyberte stav" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{statusOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="openingHour"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Otevírací hodina</FormLabel>
								<FormControl>
									{/* Use type="time" for user input, convert value */}
									<Input
										type="time"
										value={formatHourToInput(field.value)}
										onChange={(e) =>
											field.onChange(parseInputToHour(e.target.value))
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="closingHour"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Zavírací hodina</FormLabel>
								<FormControl>
									<Input
										type="time"
										value={formatHourToInput(field.value)}
										onChange={(e) =>
											field.onChange(parseInputToHour(e.target.value))
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="imageUrl" // Changed from image_url
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL obrázku</FormLabel>
							<FormControl>
								<Input placeholder="https://..." {...field} />
							</FormControl>
							<FormDescription>
								Volitelné: Odkaz na obrázek sportoviště.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* --- Activity Selection Section --- */}
				<div className="space-y-4 rounded-md border p-4">
					<h3 className="text-lg font-medium">Dostupné Aktivity</h3>
					<p className="text-muted-foreground text-sm">
						Vyberte aktivity, které budou na tomto sportovišti dostupné pro
						rezervaci.
					</p>
					{isLoadingActivities && (
						<div className="text-muted-foreground flex items-center space-x-2">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Načítání aktivit...</span>
						</div>
					)}
					{activitiesError && (
						<div className="text-destructive flex items-center space-x-2">
							<AlertCircle className="h-4 w-4" />
							<span>Chyba při načítání aktivit.</span>
						</div>
					)}
					{!isLoadingActivities && !activitiesError && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
							{allActivities && allActivities.length > 0 ? (
								allActivities.map((activity) => (
									<div
										key={activity.id}
										className="flex items-center space-x-2"
									>
										<Checkbox
											id={`activity-${activity.id}`}
											checked={selectedActivityIds.includes(activity.id)}
											onCheckedChange={(checked) =>
												handleActivityCheckChange(activity.id, checked)
											}
											disabled={isLoading}
										/>
										<Label
											htmlFor={`activity-${activity.id}`}
											className="font-normal"
										>
											{activity.name}
										</Label>
									</div>
								))
							) : (
								<p className="text-muted-foreground col-span-full text-sm">
									Nejsou definovány žádné aktivní aktivity. Vytvořte je prosím v
									sekci Správa Aktivit.
								</p>
							)}
						</div>
					)}
					<FormField
						control={form.control}
						name="activityIds"
						render={() => <FormMessage />} // Render only message if needed
					/>
				</div>
				{/* --- End Activity Selection Section --- */}

				<Button type="submit" disabled={isLoading}>
					{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{isEditMode ? 'Uložit změny' : 'Vytvořit sportoviště'}
				</Button>
			</form>
		</Form>
	);
}
