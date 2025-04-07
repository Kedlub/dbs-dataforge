'use client';

import { useState, useEffect } from 'react';
import { CalendarX, Check, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
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
import { Reservation } from '@/lib/types';
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
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [isCancelling, setIsCancelling] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	const fetchReservations = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch('/api/reservations');
			if (!response.ok) {
				throw new Error('Failed to fetch reservations');
			}
			const data = await response.json();
			setReservations(data);
		} catch (err) {
			setError('Failed to load reservations. Please try again.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchReservations();
	}, []);

	const getStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'confirmed':
				return (
					<Badge className="bg-green-500 hover:bg-green-600">
						<Check className="mr-1 h-3 w-3" /> Confirmed
					</Badge>
				);
			case 'cancelled':
				return (
					<Badge variant="destructive">
						<CalendarX className="mr-1 h-3 w-3" /> Cancelled
					</Badge>
				);
			case 'pending':
				return (
					<Badge
						variant="outline"
						className="border-yellow-500 text-yellow-500"
					>
						<Loader2 className="mr-1 h-3 w-3 animate-spin" /> Pending
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
					cancellationReason: 'Cancelled by user'
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
								cancellationReason: 'Cancelled by user'
							}
						: reservation
				)
			);
		} catch (err) {
			setError('Failed to cancel reservation. Please try again.');
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
							My Reservations
						</h1>
						<p className="text-muted-foreground">
							View and manage your upcoming and past reservations
						</p>
					</div>
					<Button
						variant="outline"
						onClick={fetchReservations}
						disabled={isLoading}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
						/>
						Refresh
					</Button>
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-8 w-8 animate-spin" />
						<span className="ml-2">Loading reservations...</span>
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
						<h3 className="text-lg font-medium">No reservations found</h3>
						<p className="text-muted-foreground mt-1">
							You don't have any reservations yet
						</p>
					</div>
				)}

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{reservations.map((reservation) => (
						<Card key={reservation.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<CardTitle className="text-lg font-medium">
										{reservation.activity?.name || 'Activity'}
									</CardTitle>
									{getStatusBadge(reservation.status)}
								</div>
								<CardDescription>
									Booked on{' '}
									{format(new Date(reservation.createdAt), 'MMM d, yyyy')}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<p className="text-sm font-medium">Time Slot</p>
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
													-{format(new Date(reservation.timeSlot.endTime), 'p')}
												</>
											) : (
												'Time information not available'
											)}
										</p>
									</div>
									<div>
										<p className="text-sm font-medium">Price</p>
										<p className="text-muted-foreground text-sm">
											$
											{parseFloat(reservation.totalPrice.toString()).toFixed(2)}
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
									>
										Cancel Reservation
									</Button>
								)}
								{reservation.status.toLowerCase() === 'cancelled' &&
									reservation.cancellationReason && (
										<div className="text-muted-foreground w-full text-sm">
											<span className="font-medium">Cancellation reason:</span>{' '}
											{reservation.cancellationReason}
										</div>
									)}
							</CardFooter>
						</Card>
					))}
				</div>
			</div>

			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this reservation? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							Nevermind
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={cancelReservation}
							disabled={isCancelling}
							className="bg-red-500 hover:bg-red-600"
						>
							{isCancelling ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelling...
								</>
							) : (
								'Yes, Cancel'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
