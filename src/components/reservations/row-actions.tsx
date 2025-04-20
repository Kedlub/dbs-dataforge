'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { Reservation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
}

export function DataTableRowActions<TData extends Reservation>({
	row
}: DataTableRowActionsProps<TData>) {
	const reservation = row.original;
	const router = useRouter();
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [cancellationReason, setCancellationReason] = useState('');
	const [isCancelling, setIsCancelling] = useState(false);

	const handleCancel = async () => {
		if (!cancellationReason) {
			toast.error('Prosím, zadejte důvod zrušení.');
			return;
		}
		setIsCancelling(true);
		try {
			const response = await fetch(
				`/api/reservations/${reservation.id}/cancel`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ cancellationReason })
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Nepodařilo se zrušit rezervaci');
			}

			toast.success('Rezervace byla úspěšně zrušena.');
			setShowCancelDialog(false);
			setCancellationReason('');
			// Refresh the table data
			router.refresh();
		} catch (error: any) {
			console.error('Failed to cancel reservation:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsCancelling(false);
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
					>
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">Otevřít menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[160px]">
					<DropdownMenuLabel>Akce</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => console.log('Edit reservation:', reservation.id)}
					>
						Upravit
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-red-600 focus:bg-red-50 focus:text-red-700"
						onSelect={(e) => e.preventDefault()} // Prevent auto-close
						onClick={() => setShowCancelDialog(true)}
						disabled={reservation.status === 'cancelled' || isCancelling}
					>
						Stornovat
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Cancel Confirmation Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Opravdu chcete zrušit rezervaci?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tato akce nemůže být vrácena zpět. Zadejte prosím důvod zrušení.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="cancellationReason">Důvod zrušení</Label>
						<Input
							id="cancellationReason"
							value={cancellationReason}
							onChange={(e) => setCancellationReason(e.target.value)}
							placeholder="Např. na žádost klienta"
							disabled={isCancelling}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							Zrušit
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={handleCancel}
							disabled={!cancellationReason || isCancelling}
						>
							{isCancelling ? 'Rušení...' : 'Potvrdit zrušení'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
