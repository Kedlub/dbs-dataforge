'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription
} from '@/components/ui/card';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Facility } from '@/lib/types'; // Assuming Facility type exists
import Image from 'next/image';
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	DoorClosed,
	DoorOpen,
	Pencil,
	Trash2,
	Users,
	CalendarPlus,
	Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Import useSession
import { Badge } from '@/components/ui/badge'; // Added

export default function FacilityDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession(); // Get session data
	const id = params.id as string;
	const [facility, setFacility] = useState<Facility | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false); // State for delete loading
	const [isAlertOpen, setIsAlertOpen] = useState(false); // State for confirmation dialog
	const [isGeneratingSlots, setIsGeneratingSlots] = useState(false); // State for slot generation

	useEffect(() => {
		if (!id) return;

		async function fetchFacility() {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch(`/api/facilities/${id}`);
				if (!response.ok) {
					throw new Error('Nepodařilo se načíst data sportoviště.');
				}
				const data: Facility = await response.json();
				setFacility(data);
			} catch (err: any) {
				setError(err.message || 'Nastala chyba při načítání sportoviště.');
			} finally {
				setLoading(false);
			}
		}

		fetchFacility();
	}, [id]);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/facilities/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message || 'Nepodařilo se smazat sportoviště.'
				);
			}

			toast.success('Sportoviště bylo úspěšně smazáno.');
			router.push('/app/facilities'); // Redirect after successful deletion
		} catch (err: any) {
			console.error('Delete error:', err);
			toast.error(err.message || 'Nastala chyba při mazání sportoviště.');
		} finally {
			setIsDeleting(false);
			setIsAlertOpen(false); // Close the dialog
		}
	};

	const handleGenerateSlots = async () => {
		setIsGeneratingSlots(true);
		try {
			const response = await fetch(`/api/facilities/${id}/generate-slots`, {
				method: 'POST'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || 'Nepodařilo se vygenerovat časové sloty.'
				);
			}

			const result = await response.json();
			toast.success(result.message || 'Časové sloty úspěšně vygenerovány.');
			// Optionally refresh related data if needed
		} catch (err: any) {
			console.error('Slot generation error:', err);
			toast.error(
				err.message || 'Nastala chyba při generování časových slotů.'
			);
		} finally {
			setIsGeneratingSlots(false);
		}
	};

	// Helper function to render status badge with appropriate color and icon
	const renderStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'active':
				return (
					<Badge
						variant="default"
						className="flex items-center gap-1 bg-green-600"
					>
						<CheckCircle2 className="h-3.5 w-3.5" />
						<span>Aktivní</span>
					</Badge>
				);
			case 'maintenance':
				return (
					<Badge
						variant="secondary"
						className="flex items-center gap-1 bg-yellow-500 text-black"
					>
						<Clock className="h-3.5 w-3.5" />
						<span>Údržba</span>
					</Badge>
				);
			case 'closed':
				return (
					<Badge variant="destructive" className="flex items-center gap-1">
						<AlertCircle className="h-3.5 w-3.5" />
						<span>Zavřeno</span>
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const defaultImageUrl =
		'https://placehold.co/600x400/EEE/31343C?text=Sportoviště'; // Default placeholder

	if (loading) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Skeleton className="mb-4 h-8 w-1/4" />
				<Skeleton className="mb-4 h-64 w-full" />
				<Skeleton className="mb-2 h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Chyba</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!facility) {
		return (
			<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<Alert>
					<AlertTitle>Nenalezeno</AlertTitle>
					<AlertDescription>
						Sportoviště s tímto ID nebylo nalezeno.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<>
			<div className="container space-y-6 px-4 py-6 md:px-6 md:py-8 lg:py-10">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<Button
						variant="outline"
						onClick={() => router.push('/app/facilities')}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Zpět na seznam
					</Button>

					{session?.user?.role === 'ADMIN' && (
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={handleGenerateSlots}
								disabled={isGeneratingSlots}
							>
								{isGeneratingSlots ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
										Generuji...
									</>
								) : (
									<>
										<CalendarPlus className="mr-2 h-4 w-4" /> Generovat sloty (7
										dní)
									</>
								)}
							</Button>
							<Button variant="secondary" asChild>
								<Link href={`/app/facilities/edit/${id}`}>
									<Pencil className="mr-2 h-4 w-4" />
									Upravit
								</Link>
							</Button>
							<Button
								variant="destructive"
								onClick={() => setIsAlertOpen(true)}
								disabled={isDeleting}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{isDeleting ? 'Maže se...' : 'Smazat'}
							</Button>
						</div>
					)}
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">
							{facility.name}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-lg">
							<Image
								src={facility.imageUrl || defaultImageUrl}
								alt={`Obrázek sportoviště ${facility.name}`}
								fill
								style={{ objectFit: 'cover' }}
								priority
							/>
						</div>
						<div>
							<h3 className="mb-2 text-lg font-medium">Popis</h3>
							<p className="text-muted-foreground">{facility.description}</p>
						</div>
						{/* Add other details like capacity, status, opening hours if needed */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
							<div className="flex items-center space-x-2">
								<Users className="text-muted-foreground h-5 w-5" />
								<div>
									<p className="text-sm font-medium">Kapacita</p>
									<p className="text-muted-foreground text-sm">
										{facility.capacity} osob
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<DoorOpen className="text-muted-foreground h-5 w-5" />
								<div>
									<p className="text-sm font-medium">Otevírací doba</p>
									<p className="text-muted-foreground text-sm">
										{facility.openingHour}:00
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<DoorClosed className="text-muted-foreground h-5 w-5" />
								<div>
									<p className="text-sm font-medium">Zavírací doba</p>
									<p className="text-muted-foreground text-sm">
										{facility.closingHour}:00
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Clock className="text-muted-foreground h-5 w-5" />
								<div>
									<p className="text-sm font-medium">Stav</p>
									{/* You might want to map the status enum/value to a user-friendly string */}
									<div className="mt-1">
										{renderStatusBadge(facility.status)}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Confirmation Dialog */}
			<AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Opravdu smazat sportoviště?</AlertDialogTitle>
						<AlertDialogDescription>
							Tato akce je nevratná. Sportoviště "{facility?.name || ''}" bude
							trvale odstraněno.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Zrušit</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? 'Probíhá mazání...' : 'Smazat'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
