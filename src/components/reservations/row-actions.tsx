'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { EditTimeSlotDialog } from './edit-timeslot-dialog';

interface DataTableRowActionsProps<TData> {
	row: Row<TData>;
	revalidate?: () => Promise<void> | void;
}

const reservationStatuses = ['pending', 'confirmed', 'cancelled'] as const;
type StatusTuple = typeof reservationStatuses;
type ResStatus = StatusTuple[number];

export function DataTableRowActions<TData extends Reservation>({
	row,
	revalidate
}: DataTableRowActionsProps<TData>) {
	const reservation = row.original;
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showEditStatusDialog, setShowEditStatusDialog] = useState(false);
	const [showEditNotesDialog, setShowEditNotesDialog] = useState(false);
	const [showEditTimeSlotDialog, setShowEditTimeSlotDialog] = useState(false);
	const [cancellationReason, setCancellationReason] = useState('');
	const [newStatus, setNewStatus] = useState<ResStatus>(
		reservation.status as ResStatus
	);
	const [internalNotes, setInternalNotes] = useState(
		reservation.internalNotes ?? ''
	);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

	const handleCancel = async () => {
		if (!cancellationReason) {
			toast.error('Prosím, zadejte důvod zrušení.');
			return;
		}
		setIsCancelling(true);
		try {
			const response = await fetch(`/api/reservations/${reservation.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status: 'cancelled',
					cancellationReason: cancellationReason
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Nepodařilo se zrušit rezervaci');
			}

			toast.success('Rezervace byla úspěšně zrušena.');
			setShowCancelDialog(false);
			setCancellationReason('');
			revalidate?.();
		} catch (error: any) {
			console.error('Failed to cancel reservation:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleEditStatus = async () => {
		if (newStatus === reservation.status) {
			setShowEditStatusDialog(false);
			return;
		}
		setIsUpdatingStatus(true);
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
			setShowEditStatusDialog(false);
			revalidate?.();
		} catch (error: any) {
			console.error('Failed to update reservation status:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleEditNotes = async () => {
		if (internalNotes === (reservation.internalNotes ?? '')) {
			setShowEditNotesDialog(false);
			return;
		}
		setIsUpdatingNotes(true);
		try {
			const response = await fetch(`/api/reservations/${reservation.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					internalNotes: internalNotes ? internalNotes : null
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'Nepodařilo se aktualizovat poznámky'
				);
			}

			toast.success('Poznámky byly úspěšně aktualizovány.');
			setShowEditNotesDialog(false);
			revalidate?.();
		} catch (error: any) {
			console.error('Failed to update reservation notes:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsUpdatingNotes(false);
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
						onClick={() => setShowEditStatusDialog(true)}
						disabled={reservation.status === 'cancelled'}
					>
						Upravit stav
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => setShowEditNotesDialog(true)}
					>
						Upravit poznámky
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						onClick={() => setShowEditTimeSlotDialog(true)}
						disabled={
							!reservation.timeSlot || reservation.status === 'cancelled'
						}
					>
						Změnit časový slot
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

			<Dialog
				open={showEditStatusDialog}
				onOpenChange={setShowEditStatusDialog}
			>
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
								disabled={isUpdatingStatus}
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
							onClick={() => setShowEditStatusDialog(false)}
							disabled={isUpdatingStatus}
						>
							Zrušit
						</Button>
						<Button
							onClick={handleEditStatus}
							disabled={isUpdatingStatus || newStatus === reservation.status}
						>
							{isUpdatingStatus ? 'Ukládání...' : 'Uložit změny'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showEditNotesDialog} onOpenChange={setShowEditNotesDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Upravit interní poznámky</DialogTitle>
						<DialogDescription>
							Přidejte nebo upravte interní poznámky k této rezervaci. Tyto
							poznámky neuvidí běžní uživatelé.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid w-full gap-1.5">
							<Label htmlFor="internalNotes">Poznámky</Label>
							<Textarea
								id="internalNotes"
								value={internalNotes}
								onChange={(e) => setInternalNotes(e.target.value)}
								placeholder="Zadejte interní poznámku..."
								rows={4}
								disabled={isUpdatingNotes}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditNotesDialog(false)}
							disabled={isUpdatingNotes}
						>
							Zrušit
						</Button>
						<Button
							onClick={handleEditNotes}
							disabled={
								isUpdatingNotes ||
								internalNotes === (reservation.internalNotes ?? '')
							}
						>
							{isUpdatingNotes ? 'Ukládání...' : 'Uložit poznámky'}
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
							Rezervace bude označena jako 'zrušená'.
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
							disabled={isCancelling || !cancellationReason}
						>
							{isCancelling ? 'Rušení...' : 'Potvrdit zrušení'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{reservation.timeSlot && (
				<EditTimeSlotDialog
					isOpen={showEditTimeSlotDialog}
					onClose={() => setShowEditTimeSlotDialog(false)}
					reservation={reservation}
					onSuccess={revalidate}
				/>
			)}
		</>
	);
}
