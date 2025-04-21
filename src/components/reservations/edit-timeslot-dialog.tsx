'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Reservation, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AvailableSlot
	extends Pick<TimeSlot, 'id' | 'startTime' | 'endTime'> {}

interface EditTimeSlotDialogProps {
	isOpen: boolean;
	onClose: () => void;
	reservation: Reservation;
	onSuccess?: () => Promise<void> | void;
}

export function EditTimeSlotDialog({
	isOpen,
	onClose,
	reservation,
	onSuccess
}: EditTimeSlotDialogProps) {
	const router = useRouter();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		reservation.timeSlot?.startTime
			? startOfDay(new Date(reservation.timeSlot.startTime))
			: undefined
	);
	const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
	const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>();
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const fetchAvailableSlots = useCallback(
		async (date: Date) => {
			setIsLoadingSlots(true);
			setAvailableSlots([]);
			setSelectedSlotId(undefined); // Reset selection when date changes
			setFetchError(null);

			// Ensure we have the facility ID from the reservation
			const facilityId = reservation.timeSlot?.facilityId;
			if (!facilityId) {
				setFetchError('Chybí ID sportoviště v rezervaci.');
				setIsLoadingSlots(false);
				return;
			}

			try {
				const formattedDate = format(date, 'yyyy-MM-dd');
				const response = await fetch(
					`/api/timeslots/available?facilityId=${facilityId}&date=${formattedDate}`
				);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || 'Nepodařilo se načíst dostupné sloty'
					);
				}
				const slots: AvailableSlot[] = await response.json();
				setAvailableSlots(slots);
				if (slots.length === 0) {
					setFetchError('Pro vybraný den nebyly nalezeny žádné volné sloty.');
				}
			} catch (error: any) {
				console.error('Failed to fetch available slots:', error);
				setFetchError(error.message || 'Chyba při načítání slotů.');
				toast.error(`Chyba při načítání slotů: ${error.message}`);
			} finally {
				setIsLoadingSlots(false);
			}
		},
		[reservation.id, reservation.timeSlot?.facilityId]
	);

	// Fetch slots when selectedDate changes
	useEffect(() => {
		if (selectedDate && reservation.id && reservation.timeSlot?.facilityId) {
			// Only fetch if the date is different from the original reservation date
			// or if the dialog is opened for the first time with the default date.
			// Avoid fetching if the date picker is just opened.
			const originalDate = reservation.timeSlot?.startTime
				? startOfDay(new Date(reservation.timeSlot.startTime))
				: null;

			if (
				isOpen &&
				originalDate &&
				startOfDay(selectedDate).toISOString() !== originalDate.toISOString()
			) {
				fetchAvailableSlots(selectedDate);
			} else if (
				isOpen &&
				availableSlots.length === 0 &&
				!isLoadingSlots &&
				originalDate &&
				startOfDay(selectedDate).toISOString() === originalDate.toISOString()
			) {
				// Initial fetch if dialog opens with default (original) date
				fetchAvailableSlots(selectedDate);
			}
		}
	}, [
		selectedDate,
		reservation.id,
		reservation.timeSlot?.facilityId,
		fetchAvailableSlots,
		isOpen,
		availableSlots.length,
		isLoadingSlots,
		reservation.timeSlot?.startTime
	]);

	const handleSaveChanges = async () => {
		if (!selectedSlotId) {
			toast.warning('Prosím, vyberte nový časový slot.');
			return;
		}
		if (selectedSlotId === reservation.slotId) {
			toast.info('Nový časový slot je stejný jako původní.');
			onClose();
			return;
		}

		setIsSaving(true);
		try {
			const response = await fetch(`/api/reservations/${reservation.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ slotId: selectedSlotId })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Nepodařilo se změnit časový slot');
			}

			toast.success('Časový slot rezervace byl úspěšně změněn.');
			onClose();
			onSuccess?.();
		} catch (error: any) {
			console.error('Failed to update time slot:', error);
			toast.error(`Chyba: ${error.message}`);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		// Reset state when closing
		setSelectedDate(
			reservation.timeSlot?.startTime
				? startOfDay(new Date(reservation.timeSlot.startTime))
				: undefined
		);
		setAvailableSlots([]);
		setSelectedSlotId(undefined);
		setFetchError(null);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>Změnit časový slot rezervace</DialogTitle>
					<DialogDescription>
						Vyberte nový den a časový slot pro rezervaci na sportovišti{' '}
						<strong>{reservation.timeSlot?.facility?.name ?? 'Neznámé'}</strong>
						. Budou zobrazeny pouze volné sloty.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-6 py-4">
					{/* Date Picker */}
					<div className="grid grid-cols-3 items-center gap-4">
						<Label htmlFor="date" className="text-right">
							Datum
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="date"
									variant={'outline'}
									className={cn(
										'col-span-2 justify-start text-left font-normal',
										!selectedDate && 'text-muted-foreground'
									)}
									disabled={isSaving || isLoadingSlots}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{selectedDate ? (
										format(selectedDate, 'PPP', { locale: cs })
									) : (
										<span>Vyberte datum</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={setSelectedDate}
									disabled={(date) => date < startOfDay(new Date())} // Disable past dates
									initialFocus
									locale={cs}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Time Slot Selector */}
					<div className="grid grid-cols-3 items-center gap-4">
						<Label htmlFor="timeSlot" className="text-right">
							Časový slot
						</Label>
						<Select
							value={selectedSlotId}
							onValueChange={setSelectedSlotId}
							disabled={
								!selectedDate ||
								isLoadingSlots ||
								isSaving ||
								availableSlots.length === 0
							}
						>
							<SelectTrigger className="col-span-2">
								<SelectValue
									placeholder={
										isLoadingSlots ? 'Načítání...' : 'Vyberte časový slot'
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{availableSlots.map((slot) => (
									<SelectItem key={slot.id} value={slot.id}>
										{`${format(new Date(slot.startTime), 'HH:mm', { locale: cs })} - ${format(new Date(slot.endTime), 'HH:mm', { locale: cs })}`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{fetchError && (
						<p className="text-destructive col-span-3 text-center text-sm">
							{fetchError}
						</p>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isSaving}>
						Zrušit
					</Button>
					<Button
						onClick={handleSaveChanges}
						disabled={
							!selectedSlotId ||
							isSaving ||
							isLoadingSlots ||
							selectedSlotId === reservation.slotId
						}
					>
						{isSaving ? 'Ukládání...' : 'Uložit změnu'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
