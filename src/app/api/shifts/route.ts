import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '../../../../generated/prisma'; // Import Prisma namespace for raw queries

// Schema for validating the request body for creating a shift
const createShiftSchema = z.object({
	employeeId: z.string().uuid(),
	startTime: z.string().datetime(),
	endTime: z.string().datetime(),
	shiftType: z.string().min(1)
});

// GET handler to fetch shifts
export async function GET(request: Request) {
	const user = await getCurrentUser();
	if (!user || user.role?.name !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Fetch shifts including employee first name, last name, and user ID
		const shifts = await prisma.employeeShift.findMany({
			include: {
				employee: {
					include: {
						user: {
							select: {
								firstName: true,
								lastName: true,
								id: true // Ensure User ID is selected
							}
						}
					}
				}
			},
			orderBy: {
				startTime: 'asc'
			}
		});

		// Map the result to include userId
		const formattedShifts = shifts.map((shift) => ({
			id: shift.id,
			employeeId: shift.employeeId, // Keep employee model ID if needed elsewhere
			userId: shift.employee.user.id, // Add the user ID
			employeeName: `${shift.employee.user.firstName} ${shift.employee.user.lastName}`,
			startTime: shift.startTime,
			endTime: shift.endTime,
			shiftType: shift.shiftType
		}));

		return NextResponse.json(formattedShifts);
	} catch (error) {
		console.error('Failed to fetch shifts:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch shifts' },
			{ status: 500 }
		);
	}
}

// POST handler to create a new shift using the stored procedure
export async function POST(request: Request) {
	const user = await getCurrentUser();
	if (!user || user.role?.name !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validation = createShiftSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors },
				{ status: 400 }
			);
		}

		const { employeeId, startTime, endTime, shiftType } = validation.data;

		// Find the corresponding employee record ID from the user ID
		const employeeRecord = await prisma.employee.findUnique({
			where: { userId: employeeId }, // Assuming employeeId from frontend is the user ID
			select: { id: true }
		});

		if (!employeeRecord) {
			return NextResponse.json(
				{ error: 'Employee record not found for the given user ID' },
				{ status: 404 }
			);
		}

		// Call the stored procedure
		await prisma.$executeRaw`CALL assign_employee_shift(${employeeRecord.id}, ${new Date(startTime)}::timestamp with time zone, ${new Date(endTime)}::timestamp with time zone, ${shiftType});`;

		// Since the procedure doesn't return the created shift, we might not return it
		// Or we could query it back, but let's keep it simple for now.
		return NextResponse.json(
			{ message: 'Shift created successfully' },
			{ status: 201 }
		);
	} catch (error) {
		console.error('Failed to create shift:', error);
		// Handle potential database errors, e.g., constraint violations
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			// Add specific error handling if needed
		}
		return NextResponse.json(
			{ error: 'Failed to create shift' },
			{ status: 500 }
		);
	}
}
