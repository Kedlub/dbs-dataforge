import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '../../../../../generated/prisma';

// Schema for input validation
const manualReservationSchema = z
	.object({
		// User details (for finding or creating)
		userId: z.string().uuid('Invalid User ID').optional(), // Allow providing existing user ID
		firstName: z.string().min(1, 'First name is required'),
		lastName: z.string().min(1, 'Last name is required'),
		email: z.string().email('Invalid email address'),
		phone: z
			.string()
			.regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
			.optional(),

		// Reservation details
		activityId: z.string().uuid('Invalid Activity ID'),
		slotId: z.string().uuid('Invalid Time Slot ID'),
		internalNotes: z.string().optional()
	})
	.refine((data) => data.userId || data.email, {
		message:
			'Either an existing userId or an email must be provided to identify/create the user',
		path: ['userId', 'email'] // Point error to relevant fields
	});

export async function POST(request: NextRequest) {
	try {
		// Ensure only authenticated employees or admins can create manual reservations
		await requireAuth(['ADMIN', 'EMPLOYEE']);

		const body = await request.json();
		const validation = manualReservationSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const {
			userId: providedUserId,
			firstName,
			lastName,
			email,
			phone,
			activityId,
			slotId,
			internalNotes
		} = validation.data;

		// Start transaction
		const result = await prisma.$transaction(
			async (tx) => {
				let userId = providedUserId;
				let userNeedsCreation = false;

				// 1. Find or Prepare User
				if (!userId) {
					// Try finding by email (which is now required)
					const existingUser = await tx.user.findUnique({
						where: { email }
					});

					if (existingUser) {
						userId = existingUser.id;
					} else {
						userNeedsCreation = true;
					}
				}

				// 2. Create User if needed
				if (userNeedsCreation) {
					// Fetch the default 'USER' role ID
					const userRole = await tx.role.findUnique({
						where: { name: 'USER' }
					});
					if (!userRole) {
						throw new Error("Default 'USER' role not found.");
					}

					const newUser = await tx.user.create({
						data: {
							username: email, // Use email as username
							firstName,
							lastName,
							email: email, // Email is required
							phone: phone || null, // Phone is optional
							roleId: userRole.id,
							isActive: true
						}
					});
					userId = newUser.id;
				}

				// At this point, userId must be defined
				if (!userId) {
					throw new Error('Could not determine user for reservation.');
				}

				// 3. Fetch and Validate Time Slot
				const timeSlot = await tx.timeSlot.findUnique({
					where: { id: slotId }
				});

				if (!timeSlot) {
					throw new Error('Time slot not found.');
				}

				if (!timeSlot.isAvailable) {
					throw new Error('Selected time slot is no longer available.');
				}

				// 4. Fetch Activity to get price
				const activity = await tx.activity.findUnique({
					where: { id: activityId }
				});
				if (!activity) {
					throw new Error('Activity not found.');
				}

				// 5. Create Reservation
				const newReservation = await tx.reservation.create({
					data: {
						userId: userId,
						slotId: slotId,
						activityId: activityId,
						status: 'confirmed', // Manual reservations are confirmed by default
						totalPrice: activity.price, // Use activity price
						internalNotes: internalNotes || null
					}
				});

				// 6. Mark Time Slot as Unavailable
				await tx.timeSlot.update({
					where: { id: slotId },
					data: { isAvailable: false }
				});

				return newReservation;
			},
			{
				maxWait: 10000, // 10 seconds
				timeout: 20000 // 20 seconds
			}
		);

		return NextResponse.json(result);
	} catch (error: any) {
		console.error('Error creating manual reservation:', error);

		// Handle specific transaction errors or validation errors
		if (error.message.includes('not found')) {
			return NextResponse.json({ error: error.message }, { status: 404 });
		}
		if (error.message.includes('no longer available')) {
			return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
		}
		if (
			error instanceof z.ZodError ||
			error.message === 'Could not determine user for reservation.'
		) {
			return NextResponse.json(
				{
					error: error instanceof z.ZodError ? 'Invalid input' : error.message,
					details: error instanceof z.ZodError ? error.errors : undefined
				},
				{ status: 400 }
			);
		}
		// Handle Prisma transaction errors
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				// Unique constraint violation (likely email)
				let field = 'unknown unique field';
				// Safely check if target exists and is an array or string before using includes
				if (
					error.meta?.target &&
					(Array.isArray(error.meta.target) ||
						typeof error.meta.target === 'string') &&
					(error.meta.target as string[] | string).includes('email')
				) {
					field = 'email';
				}
				return NextResponse.json(
					{ error: `A user with this ${field} already exists.` },
					{ status: 409 }
				);
			}
		}

		// Handle auth errors
		if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
			return NextResponse.json({ error: error.message }, { status: 401 });
		}

		return NextResponse.json(
			{ error: 'Failed to create manual reservation' },
			{ status: 500 }
		);
	}
}
