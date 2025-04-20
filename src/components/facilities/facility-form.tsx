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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Facility } from '@/lib/types'; // Import Facility type

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
			.or(z.literal(''))
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
	initialData?: Facility;
}

export function FacilityForm({ initialData }: FacilityFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const isEditMode = !!initialData;

	const form = useForm<FacilityFormValues>({
		resolver: zodResolver(facilityFormSchema),
		defaultValues: {
			name: '',
			description: '',
			capacity: 1,
			status: 'ACTIVE',
			openingHour: 8, // Use number directly
			closingHour: 22, // Use number directly
			imageUrl: ''
		}
	});

	// Pre-fill form if in edit mode
	useEffect(() => {
		if (isEditMode && initialData) {
			form.reset({
				name: initialData.name,
				description: initialData.description || '',
				capacity: initialData.capacity,
				status: (initialData.status?.toUpperCase() ??
					'ACTIVE') as FacilityStatusString,
				openingHour: initialData.openingHour,
				closingHour: initialData.closingHour,
				imageUrl: initialData.imageUrl || ''
			});
		}
	}, [initialData, isEditMode, form]);

	async function onSubmit(data: FacilityFormValues) {
		setIsLoading(true);
		try {
			const method = isEditMode ? 'PATCH' : 'POST';
			const url = isEditMode
				? `/api/facilities/${initialData?.id}`
				: '/api/facilities';

			// Prepare data for API (potentially transform fields if needed)
			const apiData = {
				...data,
				imageUrl: data.imageUrl || null // Send null if empty
			};

			console.log(apiData);
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
					errorData.message ||
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
			router.push(
				isEditMode ? `/app/facilities/${initialData?.id}` : '/app/facilities'
			);
			router.refresh(); // Refresh server components
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
				<Button type="submit" disabled={isLoading}>
					{isLoading
						? isEditMode
							? 'Aktualizuji...'
							: 'Vytváření...'
						: isEditMode
							? 'Uložit změny'
							: 'Vytvořit sportoviště'}
				</Button>
			</form>
		</Form>
	);
}
