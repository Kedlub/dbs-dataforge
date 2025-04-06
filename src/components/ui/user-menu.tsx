'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
	const { user, isAuthenticated, isAdmin, isEmployee } = useAuth();
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	if (!isAuthenticated || !user) {
		return (
			<div className="flex space-x-2">
				<Button asChild variant="outline" size="sm">
					<Link href="/auth/login">Sign In</Link>
				</Button>
				<Button asChild size="sm">
					<Link href="/auth/register">Register</Link>
				</Button>
			</div>
		);
	}

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			await signOut({ redirect: false });
			router.push('/');
			router.refresh();
		} catch (error) {
			console.error('Error signing out:', error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold uppercase">
						{user.name?.slice(0, 2) || 'U'}
					</div>
					<span className="hidden md:inline">{user.name || 'User'}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium">{user.name || 'User'}</p>
						<p className="text-muted-foreground text-xs">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/dashboard">Dashboard</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link href="/profile">My Profile</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link href="/reservations">My Reservations</Link>
				</DropdownMenuItem>

				{isAdmin && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/admin">Administration</Link>
						</DropdownMenuItem>
					</>
				)}

				{isEmployee && !isAdmin && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href="/employee">Employee Portal</Link>
						</DropdownMenuItem>
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleLogout}
					disabled={isLoggingOut}
					className="text-destructive focus:text-destructive"
				>
					{isLoggingOut ? 'Signing out...' : 'Sign out'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
