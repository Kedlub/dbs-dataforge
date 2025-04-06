import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProfilePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/auth/login');
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">User Profile</h1>
				<Button asChild variant="outline">
					<Link href="/dashboard">Back to Dashboard</Link>
				</Button>
			</div>

			<div className="bg-card rounded-lg border p-6 shadow-sm">
				<div className="mb-6 flex items-center space-x-4">
					<div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold uppercase">
						{user.firstName[0]}
						{user.lastName[0]}
					</div>
					<div>
						<h2 className="text-2xl font-semibold">
							{user.firstName} {user.lastName}
						</h2>
						<p className="text-muted-foreground">@{user.username}</p>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<div>
						<h3 className="mb-2 text-lg font-medium">Personal Information</h3>
						<dl className="space-y-2">
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Email</dt>
								<dd className="col-span-2">{user.email}</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Phone</dt>
								<dd className="col-span-2">{user.phone || 'Not provided'}</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">
									Member Since
								</dt>
								<dd className="col-span-2">
									{new Date(user.registrationDate).toLocaleDateString()}
								</dd>
							</div>
						</dl>
					</div>

					<div>
						<h3 className="mb-2 text-lg font-medium">Account Information</h3>
						<dl className="space-y-2">
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Role</dt>
								<dd className="col-span-2 capitalize">{user.role.name}</dd>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<dt className="text-muted-foreground font-medium">Status</dt>
								<dd className="col-span-2">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
											user.isActive
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}
									>
										{user.isActive ? 'Active' : 'Inactive'}
									</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<div className="mt-8 flex space-x-3">
					<Button>Edit Profile</Button>
					<Button variant="outline">Change Password</Button>
					<Button variant="destructive" asChild>
						<Link href="/auth/logout">Log Out</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
