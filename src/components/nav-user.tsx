'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
	Shield,
	Users,
	User as UserIcon
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

export function NavUser() {
	const { user, isAdmin, isEmployee, isLoading } = useAuth();
	const { isMobile } = useSidebar();
	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Handle case when auth is still loading or user is not authenticated
	if (isLoading || !user) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" asChild>
						<Link href="/auth/login">
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">Přihlásit se</span>
							</div>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
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

	// Get first letters of name for avatar fallback
	const getInitials = () => {
		if (!user.name) return 'U';
		const nameParts = user.name.split(' ');
		if (nameParts.length >= 2) {
			return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
		}
		return nameParts[0][0].toUpperCase();
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={`https://avatar.vercel.sh/${user.username || user.email}`}
									alt={user.name || ''}
								/>
								<AvatarFallback className="rounded-lg">
									{getInitials()}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{user.name || 'User'}
								</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={`https://avatar.vercel.sh/${user.username || user.email}`}
										alt={user.name || ''}
									/>
									<AvatarFallback className="rounded-lg">
										{getInitials()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										{user.name || 'User'}
									</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link href="/app/profile">
									<UserIcon className="mr-2 h-4 w-4" />
									Můj profil
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href="/app/reservations">
									<Bell className="mr-2 h-4 w-4" />
									Moje rezervace
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>

						{isAdmin && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem asChild>
										<Link href="/app/admin">
											<Shield className="mr-2 h-4 w-4" />
											Admin Portál
										</Link>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</>
						)}

						{isEmployee && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem asChild>
										<Link href="/app/employee">
											<Users className="mr-2 h-4 w-4" />
											Portál zaměstnance
										</Link>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</>
						)}

						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							disabled={isLoggingOut}
							className="text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" />
							{isLoggingOut ? 'Odhlašování...' : 'Odhlásit se'}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
