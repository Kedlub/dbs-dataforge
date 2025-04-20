'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { UserCreateSchema, UserCreateData, Role } from '@/lib/types';

interface AddUserFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserAdded: () => void; // Callback after successful addition
}

export function AddUserForm({
	open,
	onOpenChange,
	onUserAdded
}: AddUserFormProps) {
	const [roles, setRoles] = React.useState<Role[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const form = useForm<UserCreateData>({
		resolver: zodResolver(UserCreateSchema),
		defaultValues: {
			username: '',
			password: '',
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			roleId: '',
			isActive: true
		}
	});

	React.useEffect(() => {
		async function fetchRoles() {
			setIsLoadingRoles(true);
			try {
				const response = await fetch('/api/roles');
				if (!response.ok) throw new Error('Failed to fetch roles');
				const data = await response.json();
				setRoles(data);
			} catch (error) {
				console.error(error);
				toast.error('Nepodařilo se načíst role.');
			} finally {
				setIsLoadingRoles(false);
			}
		}
		if (open) {
			fetchRoles();
		}
	}, [open]);

	async function onSubmit(values: UserCreateData) {
		setIsSubmitting(true);
		try {
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values)
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(errorData || 'Nepodařilo se vytvořit uživatele.');
			}

			toast.success('Uživatel úspěšně vytvořen.');
			form.reset(); // Reset form fields
			onUserAdded(); // Trigger callback
			onOpenChange(false); // Close dialog
		} catch (error: any) {
			console.error(error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Přidat nového uživatele</DialogTitle>
					<DialogDescription>
						Vyplňte údaje pro registraci nového uživatele.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Uživatelské jméno</FormLabel>
									<FormControl>
										<Input placeholder="jan.novak" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Heslo</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Křestní jméno</FormLabel>
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
						</div>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="jan.novak@email.cz"
											{...field}
										/>
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
									<FormLabel>Telefon (nepovinné)</FormLabel>
									<FormControl>
										<Input
											type="tel"
											placeholder="+420 123 456 789"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="roleId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isLoadingRoles}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Vyberte roli..." />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{isLoadingRoles ? (
												<SelectItem value="loading" disabled>
													Načítání rolí...
												</SelectItem>
											) : (
												roles.map((role) => (
													<SelectItem key={role.id} value={role.id}>
														{{
															ADMIN: 'Administrátor',
															EMPLOYEE: 'Zaměstnanec',
															USER: 'Uživatel'
														}[role.name] || role.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Zrušit
							</Button>
							<Button type="submit" disabled={isSubmitting || isLoadingRoles}>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Vytvořit uživatele
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
