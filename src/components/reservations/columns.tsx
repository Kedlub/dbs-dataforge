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
import { MoreHorizontal, FileText } from 'lucide-react'; // Icon for the trigger button and FileText for notes
import { DataTableRowActions } from './row-actions'; // Import the new component
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@/components/ui/tooltip';
// import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'; // If you have this component
// import { DataTableRowActions } from './data-table-row-actions'; // Component for row actions (view, cancel, etc.)

// Define TableMeta type for TanStack Table
declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface TableMeta<TData> {
		revalidate?: () => Promise<void> | void;
	}
}

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
		accessorKey: 'internalNotes',
		header: 'Poznámky',
		cell: ({ row }) => {
			const notes = row.original.internalNotes;
			return notes ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="flex cursor-default items-center justify-center">
								<FileText className="text-muted-foreground h-4 w-4" />
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p className="max-w-xs break-words whitespace-pre-wrap">
								{notes}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : null;
		},
		enableSorting: false,
		meta: { align: 'center' } // Optional: center the icon
	},
	{
		accessorKey: 'totalPrice',
		header: () => <div className="text-right">Cena</div>, // Right-align header
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
		cell: ({ row, table }) => (
			<DataTableRowActions
				row={row}
				revalidate={table.options.meta?.revalidate}
			/>
		),
		enableSorting: false,
		enableHiding: false
	}
	// {
	//     id: 'actions',
	//     cell: ({ row }) => <DataTableRowActions row={row} />,
	// },
];
