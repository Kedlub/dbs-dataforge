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
import { Switch } from '@/components/ui/switch'; // Use Switch for boolean isActive
import { UserEditSchema, UserEditData, Role, UserWithRole } from '@/lib/types';

interface EditUserFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUserUpdated: () => void; // Callback after successful update
	user: UserWithRole | null; // User data to edit
}

export function EditUserForm({
	open,
	onOpenChange,
	onUserUpdated,
	user
}: EditUserFormProps) {
	const [roles, setRoles] = React.useState<Role[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const form = useForm<UserEditData>({
		resolver: zodResolver(UserEditSchema)
		// Default values will be set in useEffect when user data is available
	});

	// Fetch roles
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

	// Set form values when user data changes
	React.useEffect(() => {
		if (user) {
			form.reset({
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phone: user.phone || '',
				roleId: user.roleId,
				isActive: user.isActive
			});
		}
	}, [user, form]);

	async function onSubmit(values: UserEditData) {
		if (!user) return; // Should not happen if form is open

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/users/${user.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values)
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(errorData || 'Nepodařilo se aktualizovat uživatele.');
			}

			toast.success('Uživatel úspěšně aktualizován.');
			onUserUpdated(); // Trigger callback
			onOpenChange(false); // Close dialog
		} catch (error: any) {
			console.error(error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	}

	// Need shadcn Switch component
	const ensureSwitchComponentExists = async () => {
		// Simple check if file exists, ideally use fs but not available here
		// Assuming if it fails, it might not exist
		try {
			await fetch('/components/ui/switch.tsx');
		} catch {
			// If fetch fails (or better check needed), run add command
			// NOTE: This is a placeholder, direct terminal command from here is not ideal
			console.warn(
				'Switch component might be missing. Run: pnpm dlx shadcn-ui@latest add switch'
			);
		}
	};

	React.useEffect(() => {
		ensureSwitchComponentExists();
	}, []);

	if (!user) return null; // Don't render dialog if no user selected

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Upravit uživatele</DialogTitle>
					<DialogDescription>
						Změňte údaje uživatele {user.firstName} {user.lastName}.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
											value={field.value ?? ''}
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
										value={field.value} // Use value for controlled component
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
						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Aktivní účet</FormLabel>
										{/* <FormDescription>Uživatel se může přihlásit.</FormDescription> */}
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
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
								Uložit změny
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
