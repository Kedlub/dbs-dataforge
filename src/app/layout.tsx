import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
	title: 'ActiveLife Sports Center',
	description: 'Reservation system for ActiveLife sports center'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`antialiased`}>
				<AuthProvider>{children}</AuthProvider>
				<Toaster />
			</body>
		</html>
	);
}
