import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '../../../../../generated/prisma';

// Schema for validating the request body for updating a shift
const updateShiftSchema = z
	.object({
		startTime: z.string().datetime().optional(),
		endTime: z.string().datetime().optional(),
		shiftType: z.string().min(1).optional()
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided for update'
	});

// PUT handler to update an existing shift
export async function PUT(
	request: Request,
	{ params }: { params: { shiftId: string } }
) {
	const user = await getCurrentUser();
	if (!user || user.role?.name !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const shiftId = params.shiftId;

	try {
		const body = await request.json();
		const validation = updateShiftSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: validation.error.errors },
				{ status: 400 }
			);
		}

		const dataToUpdate: Partial<{
			startTime: Date;
			endTime: Date;
			shiftType: string;
		}> = {};
		if (validation.data.startTime) {
			dataToUpdate.startTime = new Date(validation.data.startTime);
		}
		if (validation.data.endTime) {
			dataToUpdate.endTime = new Date(validation.data.endTime);
		}
		if (validation.data.shiftType) {
			dataToUpdate.shiftType = validation.data.shiftType;
		}

		if (Object.keys(dataToUpdate).length === 0) {
			return NextResponse.json(
				{ error: 'No fields provided for update' },
				{ status: 400 }
			);
		}

		const updatedShift = await prisma.employeeShift.update({
			where: { id: shiftId },
			data: dataToUpdate
		});

		return NextResponse.json(updatedShift);
	} catch (error) {
		console.error('Failed to update shift:', error);
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2025' // Record to update not found
		) {
			return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
		}
		return NextResponse.json(
			{ error: 'Failed to update shift' },
			{ status: 500 }
		);
	}
}

// DELETE handler to delete a shift
export async function DELETE(
	request: Request,
	{ params }: { params: { shiftId: string } }
) {
	const user = await getCurrentUser();
	if (!user || user.role?.name !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const shiftId = params.shiftId;

	try {
		await prisma.employeeShift.delete({
			where: { id: shiftId }
		});

		return NextResponse.json(
			{ message: 'Shift deleted successfully' },
			{ status: 200 }
		); // Or 204 No Content
	} catch (error) {
		console.error('Failed to delete shift:', error);
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2025' // Record to delete not found
		) {
			return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
		}
		return NextResponse.json(
			{ error: 'Failed to delete shift' },
			{ status: 500 }
		);
	}
}
