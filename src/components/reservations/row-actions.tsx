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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
}

const reservationStatuses = ['pending', 'confirmed', 'cancelled'] as const;
type StatusTuple = typeof reservationStatuses;
type ResStatus = StatusTuple[number];

export function DataTableRowActions<TData extends Reservation>({
	row
}: DataTableRowActionsProps<TData>) {
	const reservation = row.original;
	const router = useRouter();
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [cancellationReason, setCancellationReason] = useState('');
	const [newStatus, setNewStatus] = useState<ResStatus>(
		reservation.status as ResStatus
	);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

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
			router.refresh();
		} catch (error: any) {
			console.error('Failed to cancel reservation:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleEdit = async () => {
		if (newStatus === reservation.status) {
			setShowEditDialog(false);
			return;
		}
		setIsUpdating(true);
		try {
			const response = await fetch(`/api/reservations/${reservation.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'Nepodařilo se aktualizovat rezervaci'
				);
			}

			toast.success('Stav rezervace byl úspěšně aktualizován.');
			setShowEditDialog(false);
			router.refresh();
		} catch (error: any) {
			console.error('Failed to update reservation status:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsUpdating(false);
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
						onSelect={(e) => e.preventDefault()}
						onClick={() => {
							setNewStatus(reservation.status as ResStatus);
							setShowEditDialog(true);
						}}
						disabled={reservation.status === 'cancelled'}
					>
						Upravit stav
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-red-600 focus:bg-red-50 focus:text-red-700"
						onSelect={(e) => e.preventDefault()}
						onClick={() => setShowCancelDialog(true)}
						disabled={reservation.status === 'cancelled' || isCancelling}
					>
						Stornovat
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Upravit stav rezervace</DialogTitle>
						<DialogDescription>
							Změňte stav rezervace (např. z čekající na potvrzenou).
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="status" className="text-right">
								Stav
							</Label>
							<Select
								value={newStatus}
								onValueChange={(value) => setNewStatus(value as ResStatus)}
								disabled={isUpdating}
							>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Vyberte stav" />
								</SelectTrigger>
								<SelectContent>
									{reservationStatuses
										.filter((status) => status !== 'cancelled')
										.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditDialog(false)}
							disabled={isUpdating}
						>
							Zrušit
						</Button>
						<Button
							onClick={handleEdit}
							disabled={isUpdating || newStatus === reservation.status}
						>
							{isUpdating ? 'Ukládání...' : 'Uložit změny'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
