'use client';

import * as React from 'react';
import {
	Calendar,
	Users,
	Dumbbell,
	Clock,
	BookCheck,
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
	const { isAdmin, isEmployee, isAuthenticated } = useAuth();
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
				title: 'Facilities',
				url: '/app/facilities',
				icon: Dumbbell,
				isActive: pathname.startsWith('/app/facilities'),
				items: [
					{
						title: 'All Facilities',
						url: '/app/facilities'
					},
					{
						title: 'Availability',
						url: '/app/facilities/availability'
					}
				]
			},
			{
				title: 'Activities',
				url: '/app/activities',
				icon: Calendar,
				isActive: pathname.startsWith('/app/activities'),
				items: [
					{
						title: 'Browse Activities',
						url: '/app/activities'
					},
					{
						title: 'Schedule',
						url: '/app/activities/schedule'
					}
				]
			},
			{
				title: 'Reservations',
				url: '/app/reservations',
				icon: BookCheck,
				isActive: pathname.startsWith('/app/reservations'),
				items: [
					{
						title: 'My Reservations',
						url: '/app/reservations'
					},
					{
						title: 'Create Reservation',
						url: '/app/reservations/create'
					},
					{
						title: 'History',
						url: '/app/reservations/history'
					}
				]
			},
			{
				title: 'Time Slots',
				url: '/app/time-slots',
				icon: Clock,
				isActive: pathname.startsWith('/app/time-slots'),
				items: [
					{
						title: 'Available Slots',
						url: '/app/time-slots'
					},
					{
						title: 'Schedule View',
						url: '/app/time-slots/schedule'
					}
				]
			}
		];

		// Items for authenticated users
		if (isAuthenticated) {
			commonItems.push({
				title: 'Profile',
				url: '/profile',
				icon: User,
				isActive: pathname === '/profile'
			});

			commonItems.push({
				title: 'Settings',
				url: '/app/settings',
				icon: Settings,
				isActive: pathname.startsWith('/app/settings'),
				items: [
					{
						title: 'Account',
						url: '/app/settings/account'
					},
					{
						title: 'Preferences',
						url: '/app/settings/preferences'
					}
				]
			});
		}

		// Items for admin role
		if (isAdmin) {
			commonItems.push({
				title: 'Users',
				url: '/app/users',
				icon: Users,
				isActive: pathname.startsWith('/app/users'),
				items: [
					{
						title: 'All Users',
						url: '/app/users'
					},
					{
						title: 'Register User',
						url: '/app/users/register'
					}
				]
			});

			commonItems.push({
				title: 'Reports',
				url: '/app/reports',
				icon: BarChart,
				isActive: pathname.startsWith('/app/reports'),
				items: [
					{
						title: 'Usage Statistics',
						url: '/app/reports/usage'
					},
					{
						title: 'Financial Reports',
						url: '/app/reports/financial'
					}
				]
			});
		}

		// Items for employee or admin role
		if (isEmployee || isAdmin) {
			commonItems.push({
				title: 'Employee Portal',
				url: '/app/employee',
				icon: UserCog,
				isActive: pathname.startsWith('/app/employee'),
				items: [
					{
						title: 'Shifts',
						url: '/app/employee/shifts'
					},
					{
						title: 'Manage Reservations',
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
			<SidebarHeader>
				<h1>ActiveLife</h1>
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
