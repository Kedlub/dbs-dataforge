import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-6 shadow-sm">
				<div className="space-y-4 text-center">
					<div className="flex justify-center">
						<FileQuestion className="text-muted-foreground h-20 w-20" />
					</div>
					<h1 className="text-primary text-4xl font-bold">404</h1>
					<h2 className="text-2xl font-semibold">Stránka nenalezena</h2>
					<p className="text-muted-foreground">
						Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
						Zkontrolujte prosím adresu URL nebo se vraťte na Dashboard.
					</p>
				</div>

				<div className="flex justify-center space-x-4 pt-4">
					<Button asChild variant="outline">
						<Link href="/app">Zpět na Dashboard</Link>
					</Button>
					<Button asChild>
						<Link href="/app/facilities">Prohlížet sportoviště</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
