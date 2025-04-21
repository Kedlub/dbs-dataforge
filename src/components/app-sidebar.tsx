'use client';

import * as React from 'react';
import {
	Calendar,
	Users,
	Dumbbell,
	Clock,
	BookCheck,
	Activity as ActivityIcon,
	User,
	UserCog,
	BarChart,
	Settings,
	Home
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { isAdmin, isEmployee } = useAuth();
	const pathname = usePathname();

	// Generate navigation data based on user role
	const generateNavigation = () => {
		const commonItems = [
			{
				title: 'Dashboard',
				url: '/app',
				icon: Home,
				isActive: pathname === '/app'
			},
			{
				title: 'Sportoviště',
				url: '/app/facilities',
				icon: Dumbbell,
				isActive: pathname.startsWith('/app/facilities'),
				items: [
					{
						title: 'Všechna sportoviště',
						url: '/app/facilities'
					},
					{
						title: 'Dostupnost',
						url: '/app/facilities/availability'
					}
				]
			},
			{
				title: 'Rezervace',
				url: '/app/reservations',
				icon: BookCheck,
				isActive: pathname.startsWith('/app/reservations'),
				items: [
					{
						title: 'Moje rezervace',
						url: '/app/reservations'
					},
					{
						title: 'Vytvořit rezervaci',
						url: '/app/facilities'
					}
				]
			}
		];

		// Items for admin role
		if (isAdmin) {
			commonItems.push({
				title: 'Uživatelé',
				url: '/app/users',
				icon: Users,
				isActive: pathname.startsWith('/app/users')
			});

			commonItems.push({
				title: 'Správa Aktivit',
				url: '/app/activities',
				icon: ActivityIcon,
				isActive: pathname.startsWith('/app/activities')
			});

			commonItems.push({
				title: 'Reporty',
				url: '/app/reports',
				icon: BarChart,
				isActive: pathname.startsWith('/app/reports')
			});

			// Items for admin role only
			commonItems.push({
				title: 'Plánování směn',
				url: '/app/shifts',
				icon: Calendar,
				isActive: pathname === '/app/shifts'
			});
			commonItems.push({
				title: 'Nastavení',
				url: '/app/settings',
				icon: Settings,
				isActive: pathname === '/app/settings'
			});
		}

		// Items for employee or admin role
		if (isEmployee || isAdmin) {
			commonItems.push({
				title: 'Portál zaměstnance',
				url: '/app/employee',
				icon: UserCog,
				isActive: pathname.startsWith('/app/employee'),
				items: [
					{
						title: 'Směny',
						url: '/app/employee/shifts'
					},
					{
						title: 'Správa rezervací',
						url: '/app/employee/reservations'
					}
				]
			});
		}

		return commonItems;
	};

	const navItems = generateNavigation();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="flex items-center justify-center">
				<h1 className="truncate text-center font-bold transition-all group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:opacity-0">
					ActiveLife
				</h1>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
