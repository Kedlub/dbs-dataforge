'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface AuthFormProps {
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

export function AuthForm({
	type,
	onSubmit,
	loading = false,
	error
}: AuthFormProps) {
	const [showPassword, setShowPassword] = useState(false);

	const isLogin = type === 'login';

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<LoginFormValues | RegisterFormValues>({
		resolver: zodResolver(isLogin ? loginSchema : registerSchema)
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

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{!isLogin && (
					<>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								type="text"
								{...register('username' as any)}
								disabled={loading}
							/>
							{(errors as any).username && (
								<p className="text-destructive text-xs">
									{(errors as any).username?.message}
								</p>
							)}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									type="text"
									{...register('firstName' as any)}
									disabled={loading}
								/>
								{(errors as any).firstName && (
									<p className="text-destructive text-xs">
										{(errors as any).firstName?.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									type="text"
									{...register('lastName' as any)}
									disabled={loading}
								/>
								{(errors as any).lastName && (
									<p className="text-destructive text-xs">
										{(errors as any).lastName?.message}
									</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Phone (Optional)</Label>
							<Input
								id="phone"
								type="tel"
								{...register('phone' as any)}
								disabled={loading}
							/>
							{(errors as any).phone && (
								<p className="text-destructive text-xs">
									{(errors as any).phone?.message}
								</p>
							)}
						</div>
					</>
				)}

				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						{...register('email')}
						disabled={loading}
					/>
					{errors.email && (
						<p className="text-destructive text-xs">{errors.email.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">Password</Label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-auto px-0 text-xs font-normal"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? 'Hide' : 'Show'}
						</Button>
					</div>
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						autoComplete={isLogin ? 'current-password' : 'new-password'}
						{...register('password')}
						disabled={loading}
					/>
					{errors.password && (
						<p className="text-destructive text-xs">
							{errors.password.message}
						</p>
					)}
				</div>

				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
				</Button>
			</form>

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
						<a
							href="/auth/register"
							className="text-primary font-semibold hover:underline"
						>
							Sign up
						</a>
					</>
				) : (
					<>
						Already have an account?{' '}
						<a
							href="/auth/login"
							className="text-primary font-semibold hover:underline"
						>
							Sign in
						</a>
					</>
				)}
			</div>
		</div>
	);
}
