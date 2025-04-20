'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	registrationDate: string;
	isActive: boolean;
	role: {
		id: string;
		name: string;
	};
}

export default function ProfilePage() {
	const { status, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
	const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
	const [profileData, setProfileData] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [shouldRefetch, setShouldRefetch] = useState(false);

	// Memoize the fetch function to prevent recreating it on every render
	const fetchUserProfile = useCallback(async () => {
		if (status === 'loading') return;

		try {
			setIsLoading(true);
			setFetchError(null);

			const response = await fetch('/api/user/profile', {
				credentials: 'include',
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache'
				}
			});

			if (!response.ok) {
				const data = await response.json();

				if (data.code === 'SESSION_EXPIRED') {
					setFetchError('Vaše session vypršela');
					return;
				}

				throw new Error(data.error || 'Failed to fetch profile data');
			}

			const data = await response.json();
			setProfileData(data);
		} catch (error) {
			console.error('Error fetching profile:', error);
			setFetchError('Nepodařilo se načíst data profilu');
		} finally {
			setIsLoading(false);
			setShouldRefetch(false);
		}
	}, [status]);

	// Effect to handle authentication state
	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login');
			return;
		}

		// Don't fetch if still loading auth
		if (status !== 'loading') {
			fetchUserProfile();
		}
	}, [status, router, fetchUserProfile]);

	// Separate effect to handle refetch requests
	useEffect(() => {
		if (shouldRefetch) {
			fetchUserProfile();
		}
	}, [shouldRefetch, fetchUserProfile]);

	const handleEditProfileSuccess = () => {
		setIsEditProfileOpen(false);
		toast.success('Profil byl úspěšně aktualizován');
		// Trigger a refetch
		setShouldRefetch(true);
	};

	const handleChangePasswordSuccess = () => {
		setIsChangePasswordOpen(false);
		toast.success('Heslo bylo úspěšně změněno');
	};

	if (status === 'loading' || isLoading || authLoading) {
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<div className="flex justify-center">
					<div className="animate-pulse text-center">
						<p>Načítání profilu...</p>
					</div>
				</div>
			</div>
		);
	}

	if (fetchError) {
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<div className="text-center">
					<h2 className="text-xl font-medium">{fetchError}</h2>
					<div className="mt-4 flex justify-center gap-3">
						<Button onClick={() => router.push('/auth/login')}>
							Přihlásit se znovu
						</Button>
						<Button variant="outline" onClick={() => router.push('/app')}>
							Zpět na Dashboard
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!profileData) {
		return (
			<div className="container mx-auto max-w-4xl p-6">
				<div className="text-center">
					<h2 className="text-xl font-medium">
						Nepodařilo se načíst data profilu
					</h2>
					<Button className="mt-4" onClick={() => setShouldRefetch(true)}>
						Zkusit znovu
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Uživatelský účet</h1>
				<Button asChild variant="outline">
					<Link href="/app">Zpět na Dashboard</Link>
				</Button>
			</div>

			<div className="bg-card rounded-lg border p-6 shadow-sm">
				<div className="mb-6 flex items-center space-x-4">
					<div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold uppercase">
						{profileData.firstName[0]}
						{profileData.lastName[0]}
					</div>
					<div>
						<h2 className="text-2xl font-semibold">
							{profileData.firstName} {profileData.lastName}
						</h2>
						<p className="text-muted-foreground">@{profileData.username}</p>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<div>
						<h3 className="mb-2 text-lg font-medium">Osobní informace</h3>
						<dl className="space-y-2">
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Email</dt>
								<dd className="col-span-2">{profileData.email}</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Telefon</dt>
								<dd className="col-span-2">
									{profileData.phone || 'Nevyplněno'}
								</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">
									Datum registrace
								</dt>
								<dd className="col-span-2">
									{new Date(profileData.registrationDate).toLocaleDateString(
										'cs-CZ'
									)}
								</dd>
							</div>
						</dl>
					</div>

					<div>
						<h3 className="mb-2 text-lg font-medium">Informace o účtu</h3>
						<dl className="space-y-2">
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Role</dt>
								<dd className="col-span-2 capitalize">
									{profileData.role.name}
								</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Status</dt>
								<dd className="col-span-2">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
											profileData.isActive
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}
									>
										{profileData.isActive ? 'Aktivní' : 'Neaktivní'}
									</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<div className="mt-8 flex space-x-3">
					<Button onClick={() => setIsEditProfileOpen(true)}>
						Upravit profil
					</Button>
					<Button
						variant="outline"
						onClick={() => setIsChangePasswordOpen(true)}
					>
						Změnit heslo
					</Button>
					<Button variant="destructive" asChild>
						<Link href="/auth/logout">Odhlásit se</Link>
					</Button>
				</div>
			</div>

			{/* Edit Profile Dialog */}
			<Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
				<DialogContent className="sm:max-w-[550px]">
					<EditProfileForm
						user={profileData}
						onSuccess={handleEditProfileSuccess}
						onCancel={() => setIsEditProfileOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Change Password Dialog */}
			<Dialog
				open={isChangePasswordOpen}
				onOpenChange={setIsChangePasswordOpen}
			>
				<DialogContent className="sm:max-w-[550px]">
					<ChangePasswordForm
						onSuccess={handleChangePasswordSuccess}
						onCancel={() => setIsChangePasswordOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
