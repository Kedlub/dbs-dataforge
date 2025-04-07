import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookCheck, ArrowRight } from 'lucide-react';

export default async function Dashboard() {
	const user = await getCurrentUser();

	if (!user) {
		return null; // Layout already handles redirect for unauthenticated users
	}

	// This would normally be fetched from database
	const upcomingReservations = [
		{
			id: '1',
			activity: 'Plavání',
			facility: 'Bazén',
			date: '2025-04-10',
			time: '15:00 - 16:00'
		},
		{
			id: '2',
			activity: 'Basketbal',
			facility: 'Kurt 2',
			date: '2025-04-12',
			time: '18:00 - 19:30'
		}
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Nadcházející rezervace
						</CardTitle>
						<BookCheck className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{upcomingReservations.length}
						</div>
						<p className="text-muted-foreground text-xs">
							{upcomingReservations.length > 0
								? `Další: ${upcomingReservations[0].activity} dne ${upcomingReservations[0].date}`
								: 'Žádné nadcházející rezervace'}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Dostupné časové sloty
						</CardTitle>
						<Clock className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">25+</div>
						<p className="text-muted-foreground text-xs">Na příštích 7 dní</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Dnešní aktivity
						</CardTitle>
						<Calendar className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12</div>
						<p className="text-muted-foreground text-xs">
							Napříč všemi sportovišti
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Nadcházející rezervace</CardTitle>
						<CardDescription>
							Vaše nadcházející rezervace v centru ActiveLife
						</CardDescription>
					</CardHeader>
					<CardContent>
						{upcomingReservations.length > 0 ? (
							<div className="space-y-4">
								{upcomingReservations.map((reservation) => (
									<div
										key={reservation.id}
										className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
									>
										<div>
											<div className="font-medium">{reservation.activity}</div>
											<div className="text-muted-foreground text-sm">
												{reservation.facility}
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium">{reservation.date}</div>
											<div className="text-muted-foreground text-sm">
												{reservation.time}
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground">
								Nebyly nalezeny žádné nadcházející rezervace.
							</p>
						)}
					</CardContent>
					<CardFooter>
						<Button asChild variant="outline" className="w-full">
							<Link href="/app/reservations">
								Zobrazit všechny rezervace
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Rychlé akce</CardTitle>
						<CardDescription>Běžné úkoly pro váš účet</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-2">
						<Button asChild variant="outline" className="justify-start">
							<Link href="/app/reservations/create">
								<BookCheck className="mr-2 h-4 w-4" />
								Vytvořit novou rezervaci
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link href="/profile">
								<Clock className="mr-2 h-4 w-4" />
								Aktualizovat informace profilu
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link href="/app/facilities">
								<Calendar className="mr-2 h-4 w-4" />
								Prohlížet sportoviště
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
