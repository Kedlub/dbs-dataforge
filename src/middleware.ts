import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs only on the specified paths
export default withAuth(
	function middleware(req) {
		const token = req.nextauth?.token;
		const path = req.nextUrl.pathname;

		// Public routes that don't need authentication
		const publicRoutes = [
			'/',
			'/auth/login',
			'/auth/register',
			'/auth/logout',
			'/auth/error'
		];

		// Check if the path is public
		if (publicRoutes.includes(path)) {
			return NextResponse.next();
		}

		// If user is not authenticated
		if (!token) {
			// Don't include callback url to prevent infinite redirects
			return NextResponse.redirect(new URL('/auth/login', req.url));
		}

		// Admin-only routes
		const adminRoutes = ['/admin'];
		if (
			adminRoutes.some((route) => path.startsWith(route)) &&
			token.role !== 'admin'
		) {
			return NextResponse.redirect(new URL('/403', req.url));
		}

		// Employee or admin routes
		const employeeRoutes = ['/employee', '/management'];
		if (
			employeeRoutes.some((route) => path.startsWith(route)) &&
			token.role !== 'admin' &&
			token.role !== 'employee'
		) {
			return NextResponse.redirect(new URL('/403', req.url));
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token
		}
	}
);

// Define which routes this middleware should run on
export const config = {
	matcher: [
		// Protected routes - explicitly define each
		'/dashboard/:path*',
		'/profile/:path*',
		'/admin/:path*',
		'/employee/:path*',
		'/management/:path*',
		'/app/:path*'
		// Remove the catchall pattern that was causing issues
	]
};
