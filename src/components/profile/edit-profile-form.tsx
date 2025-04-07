'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	DialogHeader,
	DialogTitle,
	DialogFooter
} from '@/components/ui/dialog';

const formSchema = z.object({
	firstName: z
		.string()
		.min(2, { message: 'Jméno musí obsahovat alespoň 2 znaky' }),
	lastName: z
		.string()
		.min(2, { message: 'Příjmení musí obsahovat alespoň 2 znaky' }),
	email: z.string().email({ message: 'Neplatný formát emailu' }),
	phone: z.string().optional()
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface EditProfileFormProps {
	user: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		phone?: string | null;
	};
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function EditProfileForm({
	user,
	onSuccess,
	onCancel
}: EditProfileFormProps) {
	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			phone: user.phone || ''
		}
	});

	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function onSubmit(values: ProfileFormValues) {
		setIsSubmitting(true);

		try {
			const response = await fetch('/api/user/update', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(values)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Něco se pokazilo');
			}

			toast.success('Profil byl úspěšně aktualizován');
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error('Chyba při aktualizaci profilu:', error);
			toast.error(
				error instanceof Error ? error.message : 'Chyba při aktualizaci profilu'
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Upravit profil</DialogTitle>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Jméno</FormLabel>
								<FormControl>
									<Input placeholder="Jan" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Příjmení</FormLabel>
								<FormControl>
									<Input placeholder="Novák" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="jan.novak@example.cz" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Telefon</FormLabel>
								<FormControl>
									<Input placeholder="+420 123 456 789" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>

			<DialogFooter className="gap-2 sm:gap-0">
				<Button type="button" variant="outline" onClick={onCancel}>
					Zrušit
				</Button>
				<Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
					{isSubmitting ? 'Ukládám...' : 'Uložit změny'}
				</Button>
			</DialogFooter>
		</>
	);
}
