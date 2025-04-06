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

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail
} from '@/components/ui/sidebar';

// Navigation data based on sports center reservation system
const data = {
	user: {
		name: 'User',
		email: 'user@activelife.com',
		avatar: '/avatars/user.jpg'
	},
	navMain: [
		{
			title: 'Dashboard',
			url: '/',
			icon: Home,
			isActive: true
		},
		{
			title: 'Facilities',
			url: '/facilities',
			icon: Dumbbell,
			items: [
				{
					title: 'All Facilities',
					url: '/facilities'
				},
				{
					title: 'Availability',
					url: '/facilities/availability'
				}
			]
		},
		{
			title: 'Activities',
			url: '/activities',
			icon: Calendar,
			items: [
				{
					title: 'Browse Activities',
					url: '/activities'
				},
				{
					title: 'Schedule',
					url: '/activities/schedule'
				}
			]
		},
		{
			title: 'Reservations',
			url: '/reservations',
			icon: BookCheck,
			items: [
				{
					title: 'My Reservations',
					url: '/reservations'
				},
				{
					title: 'Create Reservation',
					url: '/reservations/create'
				},
				{
					title: 'History',
					url: '/reservations/history'
				}
			]
		},
		{
			title: 'Time Slots',
			url: '/time-slots',
			icon: Clock,
			items: [
				{
					title: 'Available Slots',
					url: '/time-slots'
				},
				{
					title: 'Schedule View',
					url: '/time-slots/schedule'
				}
			]
		},
		{
			title: 'Users',
			url: '/users',
			icon: Users,
			items: [
				{
					title: 'All Users',
					url: '/users'
				},
				{
					title: 'Register User',
					url: '/users/register'
				}
			]
		},
		{
			title: 'Employee Portal',
			url: '/employee',
			icon: UserCog,
			items: [
				{
					title: 'Shifts',
					url: '/employee/shifts'
				},
				{
					title: 'Manage Reservations',
					url: '/employee/reservations'
				}
			]
		},
		{
			title: 'Reports',
			url: '/reports',
			icon: BarChart,
			items: [
				{
					title: 'Usage Statistics',
					url: '/reports/usage'
				},
				{
					title: 'Financial Reports',
					url: '/reports/financial'
				}
			]
		},
		{
			title: 'Profile',
			url: '/profile',
			icon: User
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: Settings,
			items: [
				{
					title: 'Account',
					url: '/settings/account'
				},
				{
					title: 'Preferences',
					url: '/settings/preferences'
				}
			]
		}
	]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<h1>ActiveLife</h1>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
