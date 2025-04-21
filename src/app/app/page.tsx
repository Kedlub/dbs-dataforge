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
import { Clock, Calendar, BookCheck, ArrowRight, User } from 'lucide-react';
import prisma from '@/lib/db';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export default async function Dashboard() {
	const user = await getCurrentUser();

	if (!user) {
		return null; // Layout already handles redirect for unauthenticated users
	}

	// Fetch real upcoming reservations for the user
	const upcomingReservations = await prisma.reservation.findMany({
		where: {
			userId: user.id,
			status: 'confirmed',
			timeSlot: {
				startTime: {
					gte: new Date()
				}
			}
		},
		include: {
			activity: true,
			timeSlot: {
				include: {
					facility: true
				}
			}
		},
		orderBy: {
			timeSlot: {
				startTime: 'asc'
			}
		},
		take: 5
	});

	// Count available time slots for the next 7 days
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);

	const availableTimeSlots = await prisma.timeSlot.count({
		where: {
			isAvailable: true,
			startTime: {
				gte: new Date(),
				lte: nextWeek
			}
		}
	});

	// Count today's activities
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	today.setHours(0, 0, 0, 0);
	tomorrow.setHours(0, 0, 0, 0);

	// Count unique facilities with activities today
	const todayActivities = await prisma.timeSlot.findMany({
		where: {
			startTime: {
				gte: today,
				lt: tomorrow
			}
		},
		select: {
			facilityId: true
		},
		distinct: ['facilityId']
	});

	const todayActivitiesCount = todayActivities.length;

	// Format reservations for display
	const formattedReservations = upcomingReservations.map((reservation) => ({
		id: reservation.id,
		activity: reservation.activity.name,
		facility: reservation.timeSlot.facility.name,
		date: format(new Date(reservation.timeSlot.startTime), 'yyyy-MM-dd'),
		time: `${format(new Date(reservation.timeSlot.startTime), 'HH:mm')} - ${format(new Date(reservation.timeSlot.endTime), 'HH:mm')}`
	}));

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
							{formattedReservations.length}
						</div>
						<p className="text-muted-foreground text-xs">
							{formattedReservations.length > 0
								? `Další: ${formattedReservations[0].activity} dne ${format(new Date(formattedReservations[0].date), 'd. MMMM', { locale: cs })}`
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
						<div className="text-2xl font-bold">
							{availableTimeSlots > 25 ? '25+' : availableTimeSlots}
						</div>
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
						<div className="text-2xl font-bold">{todayActivitiesCount}</div>
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
						{formattedReservations.length > 0 ? (
							<div className="space-y-4">
								{formattedReservations.map((reservation) => (
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
											<div className="font-medium">
												{format(new Date(reservation.date), 'd. MMMM yyyy', {
													locale: cs
												})}
											</div>
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
							<Link href="/app/facilities">
								<BookCheck className="mr-2 h-4 w-4" />
								Vytvořit novou rezervaci
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link href="/app/account">
								<User className="mr-2 h-4 w-4" />
								Aktualizovat informace profilu
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link href="/app/reservations">
								<Calendar className="mr-2 h-4 w-4" />
								Zobrazit moje rezervace
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
