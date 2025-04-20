'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Reservation } from '@/lib/types'; // Assuming Reservation includes related data
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react'; // Icon for the trigger button
import { DataTableRowActions } from './row-actions'; // Import the new component
// import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'; // If you have this component
// import { DataTableRowActions } from './data-table-row-actions'; // Component for row actions (view, cancel, etc.)

export const columns: ColumnDef<Reservation>[] = [
	{
		accessorKey: 'user.fullName',
		header: 'Uživatel',
		cell: ({ row }) => {
			const user = row.original.user;
			return user ? `${user.firstName} ${user.lastName}` : 'Neznámý';
		},
		enableSorting: true,
		enableHiding: false
	},
	{
		accessorKey: 'activity.name',
		header: 'Aktivita',
		cell: ({ row }) => row.original.activity?.name ?? 'Neznámá',
		enableSorting: true
	},
	{
		accessorKey: 'timeSlot.facilityName', // Assuming facility name is available via timeSlot
		header: 'Sportoviště',
		cell: ({ row }) => row.original.timeSlot?.facility?.name ?? 'Neznámé',
		enableSorting: true
	},
	{
		accessorKey: 'timeSlot.startTime',
		header: 'Datum a čas',
		cell: ({ row }) => {
			const startTime = row.original.timeSlot?.startTime;
			return startTime
				? format(new Date(startTime), 'Pp', { locale: cs })
				: 'Neznámý';
		},
		enableSorting: true
	},
	{
		accessorKey: 'status',
		header: 'Stav',
		cell: ({ row }) => {
			const status = row.original.status;
			let variant: 'default' | 'secondary' | 'destructive' | 'outline' =
				'secondary';
			if (status === 'confirmed') variant = 'default';
			if (status === 'cancelled') variant = 'destructive';
			if (status === 'pending') variant = 'outline';
			return <Badge variant={variant}>{status}</Badge>;
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
		enableSorting: true
	},
	{
		accessorKey: 'totalPrice',
		header: 'Cena',
		cell: ({ row }) => {
			const amount = parseFloat(String(row.getValue('totalPrice')));
			const formatted = new Intl.NumberFormat('cs-CZ', {
				style: 'currency',
				currency: 'CZK'
			}).format(amount);
			return <div className="text-right font-medium">{formatted}</div>;
		},
		enableSorting: true
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
		enableSorting: false,
		enableHiding: false
	}
	// {
	//     id: 'actions',
	//     cell: ({ row }) => <DataTableRowActions row={row} />,
	// },
];
