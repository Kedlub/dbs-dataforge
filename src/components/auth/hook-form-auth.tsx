'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';

interface HookFormAuthProps {
	type: 'login' | 'register';
	onSubmit: (data: any) => void;
	loading?: boolean;
	error?: string;
}

// Login form schema
const loginSchema = z.object({
	email: z
		.string()
		.min(1, { message: 'Email je povinný' })
		.email({ message: 'Musí být platný email' }),
	password: z.string().min(6, { message: 'Heslo musí mít alespoň 6 znaků' })
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
	username: z
		.string()
		.min(3, { message: 'Uživatelské jméno musí mít alespoň 3 znaky' })
		.max(20, { message: 'Uživatelské jméno musí mít méně než 20 znaků' }),
	firstName: z.string().min(1, { message: 'Křestní jméno je povinné' }),
	lastName: z.string().min(1, { message: 'Příjmení je povinné' }),
	email: z
		.string()
		.min(1, { message: 'Email je povinný' })
		.email({ message: 'Musí být platný email' }),
	password: z.string().min(6, { message: 'Heslo musí mít alespoň 6 znaků' }),
	phone: z.string().optional()
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function HookFormAuth({
	type,
	onSubmit,
	loading = false,
	error
}: HookFormAuthProps) {
	const [showPassword, setShowPassword] = useState(false);

	const isLogin = type === 'login';
	const schema = isLogin ? loginSchema : registerSchema;

	const form = useForm<any>({
		resolver: zodResolver(schema),
		defaultValues: isLogin
			? { email: '', password: '' }
			: {
					username: '',
					firstName: '',
					lastName: '',
					email: '',
					password: '',
					phone: ''
				}
	});

	return (
		<div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-bold">
					{isLogin ? 'Přihlášení' : 'Vytvoření účtu'}
				</h1>
				<p className="text-muted-foreground text-sm">
					{isLogin
						? 'Zadejte své přihlašovací údaje pro přístup k vašemu účtu'
						: 'Vyplňte formulář níže pro vytvoření vašeho účtu'}
				</p>
			</div>

			{error && (
				<div className="bg-destructive/15 text-destructive rounded-md p-3 text-center text-sm">
					{error}
				</div>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					{!isLogin && (
						<>
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Uživatelské jméno</FormLabel>
										<FormControl>
											<Input
												placeholder="johndoe"
												{...field}
												disabled={loading}
											/>
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
												<Input
													placeholder="Jan"
													{...field}
													disabled={loading}
												/>
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
												<Input
													placeholder="Novák"
													{...field}
													disabled={loading}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telefon (Volitelné)</FormLabel>
										<FormControl>
											<Input
												type="tel"
												placeholder="+420 123 456 789"
												{...field}
												disabled={loading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="jan.novak@example.com"
										autoComplete="email"
										{...field}
										disabled={loading}
									/>
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
								<div className="flex items-center justify-between">
									<FormLabel>Heslo</FormLabel>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-auto px-0 text-xs font-normal"
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
								<FormControl>
									<Input
										type={showPassword ? 'text' : 'password'}
										autoComplete={isLogin ? 'current-password' : 'new-password'}
										{...field}
										disabled={loading}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading
							? 'Zpracování...'
							: isLogin
								? 'Přihlásit se'
								: 'Vytvořit účet'}
					</Button>
				</form>
			</Form>

			<div className="relative">
				<Separator />
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="bg-background text-muted-foreground px-2 text-xs">
						NEBO
					</span>
				</div>
			</div>

			<div className="text-center text-sm">
				{isLogin ? (
					<>
						Nemáte účet?{' '}
						<Link
							href="/auth/register"
							className="text-primary font-semibold hover:underline"
						>
							Registrovat se
						</Link>
					</>
				) : (
					<>
						Již máte účet?{' '}
						<Link
							href="/auth/login"
							className="text-primary font-semibold hover:underline"
						>
							Přihlásit se
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
