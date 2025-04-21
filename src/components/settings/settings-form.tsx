'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';

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
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from '@/components/ui/card';
import { SystemSettings } from '@/lib/types';
import {
	systemSettingsSchema,
	SystemSettingsSchemaType
} from '@/lib/validators/settings';

interface SettingsFormProps {
	initialData: SystemSettings;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = React.useState<boolean>(false);

	const form = useForm<SystemSettingsSchemaType>({
		resolver: zodResolver(systemSettingsSchema),
		defaultValues: {
			defaultOpeningHour: initialData.defaultOpeningHour,
			defaultClosingHour: initialData.defaultClosingHour,
			maxBookingLeadDays: initialData.maxBookingLeadDays,
			cancellationDeadlineHours: initialData.cancellationDeadlineHours,
			maxActiveReservationsPerUser: initialData.maxActiveReservationsPerUser
		}
	});

	const onSubmit = async (values: SystemSettingsSchemaType) => {
		try {
			setIsLoading(true);
			await axios.patch('/api/settings', values);
			toast.success('Nastavení systému bylo úspěšně aktualizováno.');
			router.refresh(); // Refresh server data
		} catch (error: unknown) {
			console.error('Failed to update settings:', error);
			if (axios.isAxiosError(error) && error.response?.data?.error) {
				// If it's an Axios error with a specific error structure from our API
				toast.error(`Chyba: ${error.response.data.error}`);
			} else if (error instanceof Error) {
				// Generic error
				toast.error(error.message);
			} else {
				// Fallback for unknown errors
				toast.error(
					'Nepodařilo se aktualizovat nastavení. Zkuste to prosím znovu.'
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Obecná nastavení</CardTitle>
				<CardDescription>
					Upravte výchozí provozní dobu a pravidla rezervací.
				</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-6">
						<FormField
							control={form.control}
							name="defaultOpeningHour"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Výchozí otevírací hodina</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="8"
											{...field}
											onChange={(event) => field.onChange(+event.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Hodina (0-23), kdy centrum standardně otevírá.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="defaultClosingHour"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Výchozí zavírací hodina</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="22"
											{...field}
											onChange={(event) => field.onChange(+event.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Hodina (0-23), kdy centrum standardně zavírá.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="maxBookingLeadDays"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Max. předstih rezervace (dny)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="30"
											{...field}
											onChange={(event) => field.onChange(+event.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Kolik dní dopředu mohou uživatelé vytvářet rezervace.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="cancellationDeadlineHours"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Lhůta pro storno (hodiny)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="24"
											{...field}
											onChange={(event) => field.onChange(+event.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Minimální počet hodin před začátkem rezervace, kdy ji lze
										ještě zrušit.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="maxActiveReservationsPerUser"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Max. aktivních rezervací na uživatele</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="5"
											{...field}
											onChange={(event) => field.onChange(+event.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Kolik souběžných (budoucích, potvrzených/čekajících)
										rezervací může mít jeden uživatel.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? 'Ukládání...' : 'Uložit změny'}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
