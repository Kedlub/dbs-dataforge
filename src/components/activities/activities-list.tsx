'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Activity } from '@/lib/types'; // Assuming Activity type is defined here
import { fetcher } from '@/lib/utils'; // Simple fetcher utility
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	MoreHorizontal,
	Loader2,
	AlertCircle,
	Pencil,
	Trash2,
	CheckCircle,
	XCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Define the expected structure of Activity from API (including Decimal as string/number)
interface ApiActivity extends Omit<Activity, 'price'> {
	price: number | string;
}

// Define props for the component
interface ActivitiesListProps {
	onEdit: (activity: ApiActivity) => void; // Callback function to handle edit action
}

export function ActivitiesList({ onEdit }: ActivitiesListProps) {
	// Destructure onEdit from props
	const {
		data: activities,
		error,
		isLoading
	} = useSWR<ApiActivity[]>('/api/activities', fetcher);
	const [isMutatingId, setIsMutatingId] = useState<string | null>(null);

	const handleToggleActivityStatus = async (activity: ApiActivity) => {
		setIsMutatingId(activity.id);
		const newStatus = !activity.isActive;
		const action = newStatus ? 'aktivována' : 'deaktivována';

		try {
			const response = await fetch(`/api/activities/${activity.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: newStatus })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Nepodařilo se ${action} aktivitu`);
			}

			toast.success(`Aktivita "${activity.name}" byla úspěšně ${action}.`);
			mutate('/api/activities'); // Revalidate the SWR cache
		} catch (err: any) {
			toast.error(err.message || `Chyba při ${action} aktivity.`);
			console.error(`Error toggling activity ${activity.id} status:`, err);
		} finally {
			setIsMutatingId(null);
		}
	};

	const handleEdit = (activity: ApiActivity) => {
		// Pass the full activity object
		// TODO: Implement opening the edit dialog
		console.log(`Edit activity: ${activity.id}`);
		onEdit(activity); // Call the callback prop
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-10">
				<Loader2 className="text-primary h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="border-destructive bg-destructive/10 text-destructive my-4 flex items-center justify-center rounded border p-4">
				<AlertCircle className="mr-2 h-5 w-5" />
				Nepodařilo se načíst aktivity. Zkuste to prosím znovu později.
			</div>
		);
	}

	if (!activities || activities.length === 0) {
		return (
			<p className="text-muted-foreground py-10 text-center">
				Žádné aktivity zatím nebyly vytvořeny.
			</p>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Název</TableHead>
						<TableHead className="text-right">Doba trvání (min)</TableHead>
						<TableHead className="text-right">Cena (Kč)</TableHead>
						<TableHead className="text-right">Max. účastníků</TableHead>
						<TableHead>Stav</TableHead>
						<TableHead className="text-right">Akce</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activities.map((activity: ApiActivity) => (
						<TableRow key={activity.id}>
							<TableCell className="font-medium">{activity.name}</TableCell>
							<TableCell className="text-right">
								{activity.durationMinutes}
							</TableCell>
							<TableCell className="text-right">
								{Number(activity.price).toLocaleString('cs-CZ')}
							</TableCell>
							<TableCell className="text-right">
								{activity.maxParticipants}
							</TableCell>
							<TableCell>
								<Badge variant={activity.isActive ? 'default' : 'destructive'}>
									{activity.isActive ? 'Aktivní' : 'Neaktivní'}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											disabled={isMutatingId === activity.id}
										>
											{isMutatingId === activity.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<MoreHorizontal className="h-4 w-4" />
											)}
											<span className="sr-only">Menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => handleEdit(activity)}>
											<Pencil className="mr-2 h-4 w-4" />
											Upravit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleToggleActivityStatus(activity)}
										>
											{activity.isActive ? (
												<>
													<XCircle className="text-destructive mr-2 h-4 w-4" />{' '}
													Deaktivovat
												</>
											) : (
												<>
													<CheckCircle className="mr-2 h-4 w-4 text-green-600" />{' '}
													Aktivovat
												</>
											)}
										</DropdownMenuItem>
										{/* Add delete option if needed, maybe only for inactive?
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Smazat (trvale)
                                        </DropdownMenuItem> 
                                        */}
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
