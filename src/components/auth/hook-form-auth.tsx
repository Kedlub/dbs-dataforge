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
		.min(1, { message: 'Email is required' })
		.email({ message: 'Must be a valid email' }),
	password: z
		.string()
		.min(6, { message: 'Password must be at least 6 characters' })
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
	username: z
		.string()
		.min(3, { message: 'Username must be at least 3 characters' })
		.max(20, { message: 'Username must be less than 20 characters' }),
	firstName: z.string().min(1, { message: 'First name is required' }),
	lastName: z.string().min(1, { message: 'Last name is required' }),
	email: z
		.string()
		.min(1, { message: 'Email is required' })
		.email({ message: 'Must be a valid email' }),
	password: z
		.string()
		.min(6, { message: 'Password must be at least 6 characters' }),
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
					{isLogin ? 'Sign In' : 'Create Account'}
				</h1>
				<p className="text-muted-foreground text-sm">
					{isLogin
						? 'Enter your credentials to access your account'
						: 'Fill in the form below to create your account'}
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
										<FormLabel>Username</FormLabel>
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
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input
													placeholder="John"
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
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Doe"
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
										<FormLabel>Phone (Optional)</FormLabel>
										<FormControl>
											<Input
												type="tel"
												placeholder="+1 (555) 123-4567"
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
										placeholder="john.doe@example.com"
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
									<FormLabel>Password</FormLabel>
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
						{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
					</Button>
				</form>
			</Form>

			<div className="relative">
				<Separator />
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="bg-background text-muted-foreground px-2 text-xs">
						OR
					</span>
				</div>
			</div>

			<div className="text-center text-sm">
				{isLogin ? (
					<>
						Don't have an account?{' '}
						<Link
							href="/auth/register"
							className="text-primary font-semibold hover:underline"
						>
							Sign up
						</Link>
					</>
				) : (
					<>
						Already have an account?{' '}
						<Link
							href="/auth/login"
							className="text-primary font-semibold hover:underline"
						>
							Sign in
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
