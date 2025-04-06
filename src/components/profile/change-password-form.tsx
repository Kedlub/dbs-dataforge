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

const formSchema = z
	.object({
		currentPassword: z
			.string()
			.min(8, { message: 'Heslo musí obsahovat alespoň 8 znaků' }),
		newPassword: z
			.string()
			.min(8, { message: 'Heslo musí obsahovat alespoň 8 znaků' }),
		confirmPassword: z
			.string()
			.min(8, { message: 'Heslo musí obsahovat alespoň 8 znaků' })
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Hesla se neshodují',
		path: ['confirmPassword']
	});

type PasswordFormValues = z.infer<typeof formSchema>;

interface ChangePasswordFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function ChangePasswordForm({
	onSuccess,
	onCancel
}: ChangePasswordFormProps) {
	const form = useForm<PasswordFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		}
	});

	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function onSubmit(values: PasswordFormValues) {
		setIsSubmitting(true);

		try {
			const response = await fetch('/api/user/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword: values.currentPassword,
					newPassword: values.newPassword
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Něco se pokazilo');
			}

			toast.success('Heslo bylo úspěšně změněno');
			form.reset();
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error('Chyba při změně hesla:', error);
			toast.error(
				error instanceof Error ? error.message : 'Chyba při změně hesla'
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Změnit heslo</DialogTitle>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
					<FormField
						control={form.control}
						name="currentPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Současné heslo</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="********"
										autoComplete="current-password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="newPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nové heslo</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="********"
										autoComplete="new-password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Potvrdit nové heslo</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="********"
										autoComplete="new-password"
										{...field}
									/>
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
					{isSubmitting ? 'Ukládám...' : 'Změnit heslo'}
				</Button>
			</DialogFooter>
		</>
	);
}
