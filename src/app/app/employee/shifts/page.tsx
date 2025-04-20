'use server';

import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { EmployeeShift } from '@/lib/types'; // Assuming EmployeeShift type exists
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

async function getEmployeeShifts(userId: string): Promise<EmployeeShift[]> {
	const employee = await prisma.employee.findUnique({
		where: { userId },
		include: {
			shifts: {
				orderBy: { startTime: 'asc' }
			}
		}
	});

	if (!employee) {
		// Handle case where user is logged in but not an employee record
		// Or maybe requireAuth already handles this if we add EMPLOYEE role check
		return [];
	}

	// Make sure the returned shifts match the EmployeeShift type if it exists
	// This might require casting or selecting specific fields if the type is strict
	return employee.shifts as unknown as EmployeeShift[];
}

export default async function EmployeeShiftsPage() {
	const user = await requireAuth(['ADMIN', 'EMPLOYEE']);
	const shifts = await getEmployeeShifts(user.id);

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Moje směny</h1>
			<Card>
				<CardHeader>
					<CardTitle>Přehled naplánovaných směn</CardTitle>
				</CardHeader>
				<CardContent>
					{shifts.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Datum</TableHead>
									<TableHead>Začátek</TableHead>
									<TableHead>Konec</TableHead>
									<TableHead>Typ směny</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{shifts.map((shift) => (
									<TableRow key={shift.id}>
										<TableCell>
											{format(new Date(shift.startTime), 'PPP', { locale: cs })}
										</TableCell>
										<TableCell>
											{format(new Date(shift.startTime), 'p', { locale: cs })}
										</TableCell>
										<TableCell>
											{format(new Date(shift.endTime), 'p', { locale: cs })}
										</TableCell>
										<TableCell>{shift.shiftType}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<p>Nemáte naplánované žádné směny.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
