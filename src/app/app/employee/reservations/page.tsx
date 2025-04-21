import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { Reservation } from '@/lib/types';
import { columns } from '@/components/reservations/columns';
import { DataTable } from '@/components/reservations/data-table';
import { Metadata } from 'next';
import { ManualReservationDialog } from '@/components/reservations/ManualReservationDialog';
import { revalidatePath } from 'next/cache';

export const metadata: Metadata = {
	title: 'Správa rezervací',
	description: 'Správa všech rezervací v systému.'
};

async function getReservations(): Promise<Reservation[]> {
	const reservations = await prisma.reservation.findMany({
		include: {
			user: {
				include: {
					role: true // Include role for potential display or filtering
				}
			},
			activity: true,
			timeSlot: {
				include: {
					facility: true // Include facility details nested in timeSlot
				}
			}
		},
		orderBy: {
			timeSlot: {
				startTime: 'desc' // Show most recent first
			}
		},
		take: 100 // Limit initial load for performance
	});

	// Ensure the data matches the Reservation type, potentially excluding passwordHash
	// The Prisma type might be slightly different from our defined Reservation interface
	// We might need explicit mapping if strict type safety is needed
	// return reservations as unknown as Reservation[];
	// Convert Decimal fields to strings before passing to client component
	return reservations.map((reservation) => ({
		...reservation,
		totalPrice: reservation.totalPrice.toString(),
		activity: {
			...reservation.activity,
			price: reservation.activity.price.toString()
		}
	})) as unknown as Reservation[];
}

// Define the revalidate function outside the component
async function revalidateReservations() {
	'use server';
	revalidatePath('/app/employee/reservations');
}

export default async function EmployeeReservationsPage() {
	await requireAuth(['ADMIN', 'EMPLOYEE']);
	const reservations = await getReservations();

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Správa rezervací</h1>
					<p className="text-muted-foreground mt-1">
						Přehled všech rezervací v systému. Zde můžete spravovat existující
						rezervace.
					</p>
				</div>
				<ManualReservationDialog onSuccess={revalidateReservations} />
			</div>
			<DataTable
				columns={columns}
				data={reservations}
				revalidate={revalidateReservations}
			/>
		</div>
	);
}
