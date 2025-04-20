'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

import { UserDataTable } from '@/components/users/data-table';
import { AddUserForm } from '@/components/users/add-user-form';
import { EditUserForm } from '@/components/users/edit-user-form';
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
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { UserWithRole } from '@/lib/types';

export default function UsersPage() {
	const [users, setUsers] = React.useState<UserWithRole[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
		React.useState(false);
	const [selectedUser, setSelectedUser] = React.useState<UserWithRole | null>(
		null
	);
	const [userToDeactivate, setUserToDeactivate] = React.useState<string | null>(
		null
	);

	const fetchUsers = React.useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/users');
			if (!response.ok) {
				throw new Error('Nepodařilo se načíst uživatele');
			}
			const data = await response.json();
			setUsers(data);
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || 'Nastala chyba při načítání uživatelů.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	React.useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleAddUser = () => {
		setIsAddDialogOpen(true);
	};

	const handleEditUser = (user: UserWithRole) => {
		setSelectedUser(user);
		setIsEditDialogOpen(true);
	};

	const handleOpenDeactivateConfirm = (userId: string) => {
		setUserToDeactivate(userId);
		setIsConfirmDeleteDialogOpen(true);
	};

	const handleDeactivateUser = async () => {
		if (!userToDeactivate) return;

		const userId = userToDeactivate;
		setUserToDeactivate(null); // Clear ID immediately
		setIsConfirmDeleteDialogOpen(false); // Close confirm dialog

		try {
			toast.info('Deaktivuji uživatele...');
			const response = await fetch(`/api/users/${userId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				let errorMsg = 'Nepodařilo se deaktivovat uživatele.';
				try {
					const errorData = await response.json();
					errorMsg = errorData.message || errorMsg;
				} catch {}
				throw new Error(errorMsg);
			}

			toast.success('Uživatel úspěšně deaktivován.');
			fetchUsers(); // Refresh data
		} catch (error: any) {
			console.error(error);
			toast.error(`Chyba při deaktivaci: ${error.message}`);
		}
	};

	return (
		<div className="container mx-auto py-10">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="flex items-center text-3xl font-bold">
					<Users className="mr-2 h-8 w-8" />
					Správa uživatelů
				</h1>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<div className="flex justify-between">
						<Skeleton className="h-10 w-1/4" />
						<Skeleton className="h-10 w-32" />
					</div>
					<Skeleton className="h-[500px] w-full" />
					<div className="flex justify-end space-x-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			) : (
				<UserDataTable
					data={users}
					onAddUser={handleAddUser}
					onEditUser={handleEditUser}
					onDeactivateUser={handleOpenDeactivateConfirm}
				/>
			)}

			{/* Dialogs */}
			<AddUserForm
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onUserAdded={fetchUsers} // Refresh data on add
			/>

			<EditUserForm
				open={isEditDialogOpen}
				onOpenChange={(open) => {
					if (!open) setSelectedUser(null); // Clear selected user on close
					setIsEditDialogOpen(open);
				}}
				onUserUpdated={fetchUsers} // Refresh data on update
				user={selectedUser}
			/>

			<AlertDialog
				open={isConfirmDeleteDialogOpen}
				onOpenChange={setIsConfirmDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Opravdu chcete deaktivovat tohoto uživatele?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tato akce deaktivuje uživatelský účet. Uživatel se nebude moci
							přihlásit. Všechny budoucí rezervace uživatele budou automaticky
							zrušeny (dle nastavení triggeru). Tuto akci lze později vrátit
							manuální aktivací účtu.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setUserToDeactivate(null)}>
							Zrušit
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeactivateUser}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Deaktivovat
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
