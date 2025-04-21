import { z } from 'zod';

export const systemSettingsSchema = z
	.object({
		defaultOpeningHour: z
			.number()
			.int()
			.min(0, 'Otevírací hodina musí být mezi 0 a 23')
			.max(23, 'Otevírací hodina musí být mezi 0 a 23'),
		defaultClosingHour: z
			.number()
			.int()
			.min(0, 'Zavírací hodina musí být mezi 0 a 23')
			.max(23, 'Zavírací hodina musí být mezi 0 a 23'),
		maxBookingLeadDays: z
			.number()
			.int()
			.min(1, 'Maximální předstih rezervace musí být alespoň 1 den'),
		cancellationDeadlineHours: z
			.number()
			.int()
			.min(0, 'Lhůta pro storno nemůže být záporná'), // 0 means can cancel anytime before start
		maxActiveReservationsPerUser: z
			.number()
			.int()
			.min(1, 'Maximální počet aktivních rezervací musí být alespoň 1')
	})
	.refine((data) => data.defaultClosingHour > data.defaultOpeningHour, {
		message: 'Zavírací hodina musí být pozdější než otevírací hodina.',
		path: ['defaultClosingHour'] // Attach error to closing hour field
	});

export type SystemSettingsSchemaType = z.infer<typeof systemSettingsSchema>;
