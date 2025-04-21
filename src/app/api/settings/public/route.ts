import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/settings';
import { getAuthSession } from '@/lib/auth'; // Use getAuthSession to check for any logged-in user

// GET /api/settings/public - Fetch publicly relevant system settings (Authenticated users only)
export async function GET(request: NextRequest) {
	try {
		// Ensure user is authenticated (any role)
		const session = await getAuthSession();
		if (!session?.user) {
			// Use 401 Unauthorized if no user is logged in
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const allSettings = await getSystemSettings();

		// Select only the settings needed by the public-facing client components
		const publicSettings = {
			maxBookingLeadDays: allSettings.maxBookingLeadDays,
			cancellationDeadlineHours: allSettings.cancellationDeadlineHours
			// Add other settings here if needed publicly in the future
		};

		return NextResponse.json(publicSettings);
	} catch (error: any) {
		console.error('[SETTINGS_PUBLIC_GET] Error:', error);
		// Avoid leaking detailed error messages to public users
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
