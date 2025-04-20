'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale'; // Czech locale

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserWithRole } from '@/lib/types'; // Use the combined type

// Define props for the actions cell, if needed for callbacks
interface UserActionsCellProps {
	user: UserWithRole;
	onEdit: (user: UserWithRole) => void;
	onDeactivate: (userId: string) => void;
}

// You can define a separate component for actions if logic becomes complex
const UserActionsCell: React.FC<UserActionsCellProps> = ({
	user,
	onEdit,
	onDeactivate
}) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Otevřít menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Akce</DropdownMenuLabel>
				<DropdownMenuItem
					onClick={() => navigator.clipboard.writeText(user.email)}
				>
					Kopírovat email
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => onEdit(user)}>
					Upravit uživatele
				</DropdownMenuItem>
				{user.isActive && (
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={() => onDeactivate(user.id)}
					>
						Deaktivovat uživatele
					</DropdownMenuItem>
				)}
				{!user.isActive && (
					<DropdownMenuItem disabled>Uživatel je deaktivován</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// Define the actual columns for the table
export const columns = (
	onEdit: (user: UserWithRole) => void,
	onDeactivate: (userId: string) => void
): ColumnDef<UserWithRole>[] => [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Vybrat vše"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Vybrat řádek"
			/>
		),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'firstName',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Jméno
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const user = row.original;
			return <div>{`${user.firstName} ${user.lastName}`}</div>;
		}
	},
	{
		accessorKey: 'email',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Email
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		}
	},
	{
		accessorKey: 'username',
		header: 'Uživatelské jméno'
	},
	{
		accessorKey: 'role.name', // Access nested property 'name' instead of 'roleName'
		header: 'Role',
		cell: ({ row }) => {
			const roleName = row.original.role?.name || 'Neznámá';
			// Simple mapping for display names if needed
			const displayRole: { [key: string]: string } = {
				ADMIN: 'Administrátor',
				EMPLOYEE: 'Zaměstnanec',
				USER: 'Uživatel'
			};
			return (
				<Badge variant="outline">{displayRole[roleName] || roleName}</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		}
	},
	{
		accessorKey: 'isActive',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.getValue('isActive');
			return isActive ? (
				<Badge>Aktivní</Badge>
			) : (
				<Badge variant="secondary">Neaktivní</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		}
	},
	{
		accessorKey: 'registrationDate',
		header: 'Datum registrace',
		cell: ({ row }) => {
			const date = row.getValue('registrationDate');
			return (
				<div>{format(new Date(date as string), 'P p', { locale: cs })}</div>
			); // Format date using Czech locale
		}
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const user = row.original;
			// Pass callback functions to the cell component
			return (
				<UserActionsCell
					user={user}
					onEdit={onEdit}
					onDeactivate={onDeactivate}
				/>
			);
		},
		enableSorting: false,
		enableHiding: false
	}
];
