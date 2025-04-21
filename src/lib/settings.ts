import prisma from '@/lib/db';
import { SystemSettings } from '@/lib/types';

/**
 * Fetches the system settings. If no settings row exists in the database,
 * it creates one using the default values defined in the Prisma schema.
 * Ensures that exactly one settings record exists.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
	let settings = await prisma.systemSetting.findFirst();

	if (!settings) {
		// Double-check to prevent race conditions if multiple requests hit this simultaneously
		// Although unlikely for settings, it's good practice.
		try {
			settings = await prisma.systemSetting.create({
				data: {
					// Prisma schema defaults are applied automatically by the database
					// upon insertion when no explicit value is provided.
				}
			});
		} catch (e: any) {
			// If creation failed (e.g., unique constraint violation due to race condition),
			// fetch the existing record again.
			if (e.code === 'P2002') {
				// Unique constraint violation code
				settings = await prisma.systemSetting.findFirst();
				if (!settings) {
					// This should theoretically not happen if P2002 was thrown, but handle defensively
					throw new Error(
						'Failed to retrieve system settings after creation attempt.'
					);
				}
			} else {
				throw e; // Re-throw other errors
			}
		}
	}

	// Cast needed as Prisma types might have slight differences (e.g., Date vs string)
	// or if relations were included accidentally.
	// Ensure the returned object strictly matches the SystemSettings interface.
	return {
		id: settings.id,
		defaultOpeningHour: settings.defaultOpeningHour,
		defaultClosingHour: settings.defaultClosingHour,
		maxBookingLeadDays: settings.maxBookingLeadDays,
		cancellationDeadlineHours: settings.cancellationDeadlineHours,
		maxActiveReservationsPerUser: settings.maxActiveReservationsPerUser,
		createdAt: settings.createdAt,
		updatedAt: settings.updatedAt
	} as SystemSettings;
}
