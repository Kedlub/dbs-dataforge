'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { mutate } from 'swr'; // Import mutate for revalidation
import { Activity } from '@/lib/types';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Zod schema for form validation (client-side)
// Match API schema, but price is number initially
const formSchema = z.object({
	name: z.string().min(1, 'Název je povinný'),
	description: z.string().optional().nullable(),
	durationMinutes: z.coerce // Use coerce to handle string input from number field
		.number()
		.int()
		.positive('Doba trvání musí být kladné celé číslo'),
	price: z.coerce // Use coerce to handle string input from number field
		.number()
		.nonnegative('Cena nesmí být záporná'),
	maxParticipants: z.coerce // Use coerce to handle string input from number field
		.number()
		.int()
		.positive('Maximální počet účastníků musí být kladné celé číslo'),
	isActive: z.boolean()
});

type ActivityFormData = z.infer<typeof formSchema>;

interface ActivityFormProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	activity?: Activity | null; // Activity data for editing, null for creating
	onSuccess: () => void; // Callback on successful creation/update
}

export function ActivityForm({
	isOpen,
	onOpenChange,
	activity,
	onSuccess
}: ActivityFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isEditing = !!activity;

	const form = useForm<ActivityFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: null,
			durationMinutes: 60,
			price: 0,
			maxParticipants: 1,
			isActive: true
		}
	});

	// Reset form when activity data changes (for editing)
	useEffect(() => {
		if (isEditing && activity) {
			form.reset({
				name: activity.name,
				description: activity.description || '',
				durationMinutes: activity.durationMinutes,
				price: Number(activity.price), // Ensure price is number for form
				maxParticipants: activity.maxParticipants,
				isActive: activity.isActive
			});
		} else {
			form.reset(); // Reset to default values for creating
		}
	}, [activity, isEditing, form, isOpen]); // Add isOpen to reset on reopen

	const onSubmit = async (data: ActivityFormData) => {
		setIsSubmitting(true);
		const apiUrl = isEditing
			? `/api/activities/${activity?.id}`
			: '/api/activities';
		const method = isEditing ? 'PUT' : 'POST';

		try {
			// Price needs to be handled carefully if API expects Decimal/string
			const payload = {
				...data
				// API expects Decimal, but Zod schema transforms to Decimal on the server.
				// Here we just send the number, server-side validation handles conversion.
				// If server didn't handle conversion, we'd do it here:
				// price: String(data.price),
			};

			const response = await fetch(apiUrl, {
				method: method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Nepodařilo se uložit aktivitu');
			}

			toast.success(
				isEditing
					? 'Aktivita byla úspěšně aktualizována.'
					: 'Aktivita byla úspěšně vytvořena.'
			);
			form.reset(); // Reset form after successful submission
			onOpenChange(false); // Close the dialog
			onSuccess(); // Trigger revalidation/callback in parent
		} catch (error: any) {
			console.error('Error submitting activity form:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle dialog controlled state
	const handleOpenChange = (open: boolean) => {
		if (!isSubmitting) {
			onOpenChange(open);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? 'Upravit Aktivitu' : 'Vytvořit Novou Aktivitu'}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Upravte detaily existující aktivity.'
							: 'Zadejte informace pro vytvoření nové sportovní aktivity.'}
					</DialogDescription>
				</DialogHeader>
				<Form<ActivityFormData> {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-2"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Název *</FormLabel>
									<FormControl>
										<Input
											placeholder="Např. Plavání, Tenisová lekce"
											{...field}
										/>
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
										<Textarea
											placeholder="Krátký popis aktivity (nepovinné)"
											{...field}
											value={field.value ?? ''} // Handle null value
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="durationMinutes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Doba trvání (min) *</FormLabel>
										<FormControl>
											<Input type="number" placeholder="60" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="price"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cena (Kč) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="199"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="maxParticipants"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max. účastníků *</FormLabel>
										<FormControl>
											<Input type="number" placeholder="10" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-col pt-2.5">
										<FormLabel className="mb-2">Stav</FormLabel>
										<FormControl>
											<div className="flex items-center space-x-2">
												<Switch
													id="isActive-switch"
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
												<label
													htmlFor="isActive-switch"
													className="text-sm font-medium"
												>
													{field.value ? 'Aktivní' : 'Neaktivní'}
												</label>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Zrušit
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEditing ? 'Uložit změny' : 'Vytvořit aktivitu'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
