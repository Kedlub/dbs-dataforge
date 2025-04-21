'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import Link from 'next/link';
import { PlusCircle, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Report } from '@/lib/types'; // Assuming Report type is defined here
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReportWithUser extends Report {
	user: {
		firstName: string;
		lastName: string;
	};
}

export default function ReportsPage() {
	const { isAdmin, isLoading: authLoading } = useAuth();
	const [reports, setReports] = useState<ReportWithUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!authLoading && isAdmin) {
			fetchReports();
		} else if (!authLoading && !isAdmin) {
			setIsLoading(false); // Stop loading if user is not admin
			toast.error('Přístup odepřen');
		}
	}, [isAdmin, authLoading]);

	const fetchReports = async () => {
		setIsLoading(true);
		try {
			const response = await axios.get<ReportWithUser[]>('/api/reports');
			setReports(response.data);
		} catch (error) {
			console.error('Failed to fetch reports:', error);
			toast.error('Nepodařilo se načíst reporty.');
		} finally {
			setIsLoading(false);
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div>Přístup odepřen. Tato stránka je pouze pro administrátory.</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Správa Reportů</h1>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link href="/app/reports/usage">
							<PlusCircle className="mr-2 h-4 w-4" />
							Report Využití
						</Link>
					</Button>
					<Button asChild>
						<Link href="/app/reports/financial">
							<PlusCircle className="mr-2 h-4 w-4" />
							Finanční Report
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Vygenerované Reporty</CardTitle>
					<CardDescription>
						Seznam naposledy vygenerovaných reportů.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Název</TableHead>
								<TableHead>Typ</TableHead>
								<TableHead>Vygenerováno</TableHead>
								<TableHead>Vygeneroval</TableHead>
								<TableHead className="text-right">Akce</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reports.length > 0 ? (
								reports.map((report) => (
									<TableRow key={report.id}>
										<TableCell className="font-medium">
											<Link
												href={`/app/reports/${report.id}`}
												className="hover:underline"
											>
												{report.title}
											</Link>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">{report.reportType}</Badge>
										</TableCell>
										<TableCell>
											{format(
												new Date(report.generatedAt),
												'dd.MM.yyyy HH:mm',
												{ locale: cs }
											)}
										</TableCell>
										<TableCell>{`${report.user.firstName} ${report.user.lastName}`}</TableCell>
										<TableCell className="text-right">
											<Button asChild variant="ghost" size="icon">
												<Link href={`/app/reports/${report.id}`}>
													<FileText className="h-4 w-4" />
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="text-center">
										Nebyly nalezeny žádné reporty.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
