'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ActivitiesList } from '@/components/activities/activities-list';
import { ActivityForm } from '@/components/activities/activity-form';
import { Activity } from '@/lib/types';
import { mutate } from 'swr';

export default function ActivitiesManagementPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

	useEffect(() => {
		if (status === 'loading') return; // Wait until session is loaded
		if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
			toast.error('Přístup odepřen.');
			router.push('/app'); // Redirect non-admins
		}
	}, [session, status, router]);

	const handleOpenCreateDialog = () => {
		setEditingActivity(null);
		setIsDialogOpen(true);
	};

	const handleOpenEditDialog = (activity: Activity) => {
		setEditingActivity(activity);
		setIsDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setIsDialogOpen(false);
		setEditingActivity(null); // Clear editing state when closing
	};

	const handleFormSuccess = () => {
		mutate('/api/activities');
		handleCloseDialog();
	};

	if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
		return (
			<div className="container flex h-[calc(100vh-10rem)] items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<Loader2 className="text-primary h-8 w-8 animate-spin" />
					<p>Načítání...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container px-4 py-6 md:px-6 md:py-8 lg:py-10">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
							Správa Aktivit
						</h1>
						<p className="text-muted-foreground">
							Vytvářejte, upravujte nebo deaktivujte sportovní aktivity.
						</p>
					</div>
					<Button onClick={handleOpenCreateDialog}>
						<PlusCircle className="mr-2 h-4 w-4" />
						Vytvořit aktivitu
					</Button>
				</div>

				{/* Use the real ActivitiesList component */}
				<ActivitiesList onEdit={handleOpenEditDialog} />

				{/* Render the ActivityForm dialog */}
				<ActivityForm
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					activity={editingActivity}
					onSuccess={handleFormSuccess}
				/>
			</div>
		</div>
	);
}
