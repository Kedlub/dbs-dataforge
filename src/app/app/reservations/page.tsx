'use client';

import { useState, useEffect } from 'react';
import { CalendarX, Check, Loader2, RefreshCw } from 'lucide-react';
import { format, isBefore, subHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reservation, SystemSettings } from '@/lib/types';
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

export default function MyReservations() {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [settings, setSettings] = useState<Pick<
		SystemSettings,
		'cancellationDeadlineHours'
	> | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [isCancelling, setIsCancelling] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [reservationsResponse, settingsResponse] = await Promise.all([
				fetch('/api/reservations'),
				fetch('/api/settings/public')
			]);

			if (!reservationsResponse.ok) {
				throw new Error('Nepodařilo se načíst rezervace.');
			}
			if (!settingsResponse.ok) {
				console.error('Failed to fetch system settings');
				throw new Error('Nepodařilo se načíst nastavení systému.');
			}

			const reservationsData = await reservationsResponse.json();
			const settingsData = await settingsResponse.json();

			setReservations(reservationsData);
			setSettings(settingsData);
		} catch (err: any) {
			setError(err.message || 'Nastala neznámá chyba při načítání dat.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const canCancelReservation = (reservation: Reservation): boolean => {
		if (!settings || !reservation.timeSlot?.startTime) {
			return false;
		}
		const now = new Date();
		const startTime = new Date(reservation.timeSlot.startTime);
		const deadline = subHours(startTime, settings.cancellationDeadlineHours);
		return isBefore(now, deadline);
	};

	const getStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'confirmed':
				return (
					<Badge className="bg-green-500 hover:bg-green-600">
						<Check className="mr-1 h-3 w-3" /> Potvrzeno
					</Badge>
				);
			case 'cancelled':
				return (
					<Badge variant="destructive">
						<CalendarX className="mr-1 h-3 w-3" /> Zrušeno
					</Badge>
				);
			case 'pending':
				return (
					<Badge
						variant="outline"
						className="border-yellow-500 text-yellow-500"
					>
						<Loader2 className="mr-1 h-3 w-3 animate-spin" /> Čeká na schválení
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	const openCancelDialog = (id: string) => {
		setCancellingId(id);
		setShowCancelDialog(true);
	};

	const cancelReservation = async () => {
		if (!cancellingId) return;

		setIsCancelling(true);
		try {
			const response = await fetch(`/api/reservations/${cancellingId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status: 'cancelled',
					cancellationReason: 'Zrušeno uživatelem'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to cancel reservation');
			}

			// Update the local state
			setReservations((prevReservations) =>
				prevReservations.map((reservation) =>
					reservation.id === cancellingId
						? {
								...reservation,
								status: 'cancelled',
								cancellationReason: 'Zrušeno uživatelem'
							}
						: reservation
				)
			);
		} catch (err) {
			setError('Nepodařilo se zrušit rezervaci. Zkuste to prosím znovu.');
			console.error(err);
		} finally {
			setIsCancelling(false);
			setShowCancelDialog(false);
			setCancellingId(null);
		}
	};

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
							Moje rezervace
						</h1>
						<p className="text-muted-foreground">
							Zobrazte a spravujte své nadcházející i minulé rezervace
						</p>
					</div>
					<Button variant="outline" onClick={fetchData} disabled={isLoading}>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
						/>
						Obnovit
					</Button>
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-8 w-8 animate-spin" />
						<span className="ml-2">Načítání rezervací...</span>
					</div>
				)}

				{error && (
					<div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
						{error}
					</div>
				)}

				{!isLoading && !error && reservations.length === 0 && (
					<div className="rounded-lg border py-10 text-center">
						<CalendarX className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
						<h3 className="text-lg font-medium">Žádné rezervace nenalezeny</h3>
						<p className="text-muted-foreground mt-1">
							Zatím nemáte žádné rezervace
						</p>
					</div>
				)}

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{reservations.map((reservation) => {
						const isCancellable = canCancelReservation(reservation);
						return (
							<Card key={reservation.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg font-medium">
											{reservation.activity?.name || 'Aktivita'}
										</CardTitle>
										{getStatusBadge(reservation.status)}
									</div>
									<CardDescription>
										Rezervováno dne{' '}
										{format(new Date(reservation.createdAt), 'MMM d, yyyy')}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium">Časový slot</p>
											<p className="text-muted-foreground text-sm">
												{reservation.timeSlot ? (
													<>
														{format(
															new Date(reservation.timeSlot.startTime),
															'PPP'
														)}
														<br />
														{format(
															new Date(reservation.timeSlot.startTime),
															'p'
														)}{' '}
														-
														{format(
															new Date(reservation.timeSlot.endTime),
															'p'
														)}
													</>
												) : (
													'Časové informace nejsou k dispozici'
												)}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Cena</p>
											<p className="text-muted-foreground text-sm">
												{parseFloat(reservation.totalPrice.toString()).toFixed(
													2
												)}{' '}
												Kč
											</p>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									{reservation.status.toLowerCase() === 'confirmed' && (
										<Button
											variant="destructive"
											onClick={() => openCancelDialog(reservation.id)}
											className="w-full"
											disabled={!isCancellable}
											title={
												!isCancellable
													? `Rezervaci lze zrušit nejpozději ${settings?.cancellationDeadlineHours ?? '-'} hodin předem`
													: ''
											}
										>
											Zrušit rezervaci
										</Button>
									)}
									{reservation.status.toLowerCase() === 'cancelled' &&
										reservation.cancellationReason && (
											<div className="text-muted-foreground w-full text-sm">
												<span className="font-medium">Důvod zrušení:</span>{' '}
												{reservation.cancellationReason}
											</div>
										)}
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>

			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Zrušit rezervaci</AlertDialogTitle>
						<AlertDialogDescription>
							Opravdu chcete zrušit tuto rezervaci? Tuto akci nelze vzít zpět.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							Rozmyslel jsem si to
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={cancelReservation}
							disabled={isCancelling}
							className="bg-red-500 hover:bg-red-600"
						>
							{isCancelling ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Rušení...
								</>
							) : (
								'Ano, zrušit'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
