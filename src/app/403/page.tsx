import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
				<div className="space-y-2 text-center">
					<h1 className="text-destructive text-4xl font-bold">403</h1>
					<h2 className="text-2xl font-semibold">Přístup odepřen</h2>
					<p className="text-muted-foreground">
						Nemáte oprávnění pro přístup na tuto stránku. Pokud se domníváte, že
						jde o chybu, kontaktujte prosím administrátora.
					</p>
				</div>

				<div className="flex justify-center space-x-4 pt-4">
					<Button asChild variant="outline">
						<Link href="/">Zpět na Úvod</Link>
					</Button>
					<Button asChild>
						<Link href="/dashboard">Přejít na Dashboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
