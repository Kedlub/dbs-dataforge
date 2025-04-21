import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { systemSettingsSchema } from '@/lib/validators/settings';
import { getSystemSettings } from '@/lib/settings';

// Helper function to get or create the singleton settings row
// REMOVED - Now using imported getSystemSettings

// GET /api/settings - Fetch system settings (Admin only)
export async function GET(request: NextRequest) {
	try {
		await requireAuth(['ADMIN']); // Ensure user is admin

		const settings = await getSystemSettings();

		return NextResponse.json(settings);
	} catch (error: any) {
		console.error('[SETTINGS_GET] Error:', error);
		if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
			return new NextResponse(error.message, {
				status: error.message === 'Unauthorized' ? 401 : 403
			});
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

// PATCH /api/settings - Update system settings (Admin only)
export async function PATCH(request: NextRequest) {
	try {
		await requireAuth(['ADMIN']); // Ensure user is admin

		const body = await request.json();
		const validation = systemSettingsSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: validation.error.errors },
				{ status: 400 }
			);
		}

		const currentSettings = await getSystemSettings();

		const updatedSettings = await prisma.systemSetting.update({
			where: { id: currentSettings.id },
			data: validation.data
		});

		return NextResponse.json(updatedSettings);
	} catch (error: any) {
		console.error('[SETTINGS_PATCH] Error:', error);
		if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
			return new NextResponse(error.message, {
				status: error.message === 'Unauthorized' ? 401 : 403
			});
		}
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
