'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import uniqolor from 'uniqolor';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent
} from '@/components/ui/chart';
import {
	Bar,
	BarChart,
	XAxis,
	YAxis,
	CartesianGrid,
	LabelList,
	Cell
} from 'recharts';
import { Report } from '@/lib/types';

// Define more specific types for reportData based on reportType
interface FinancialReportData {
	startDate: string;
	endDate: string;
	totalRevenue: number;
	revenueByFacility: {
		[key: string]: {
			name: string;
			revenue: number;
			error?: string;
		};
	};
}

interface UsageReportData {
	startDate: string;
	endDate: string;
	totalReservations: number;
	reservationsByFacility: {
		[key: string]: { name: string; count: number };
	};
	reservationsByActivity: {
		[key: string]: { name: string; count: number };
	};
}

interface ReportWithUser extends Report {
	user: {
		firstName: string;
		lastName: string;
	};
	// Use a more specific type for reportData based on reportType check
	reportData: FinancialReportData | UsageReportData | any; // Use 'any' as fallback
}

// Type for chart data points including the generated fill color
interface ChartDataPoint {
	name: string;
	value: number; // Generic value (revenue or count)
	fill: string; // Generated color
}

export default function ReportDetailPage() {
	const { isAdmin, isLoading: authLoading } = useAuth();
	const params = useParams();
	const router = useRouter();
	const reportId = params.reportId as string;

	const [report, setReport] = useState<ReportWithUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!reportId) return;

		if (!authLoading && isAdmin) {
			fetchReportDetail();
		} else if (!authLoading && !isAdmin) {
			setIsLoading(false);
			toast.error('Přístup odepřen');
			router.replace('/app/reports'); // Redirect non-admins
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reportId, isAdmin, authLoading]); // Removed router from deps to avoid re-fetch on redirect

	const fetchReportDetail = async () => {
		setIsLoading(true);
		try {
			const response = await axios.get<ReportWithUser>(
				`/api/reports/${reportId}`
			);
			setReport(response.data);
		} catch (error) {
			console.error('Failed to fetch report details:', error);
			toast.error('Nepodařilo se načíst detaily reportu.');
			router.replace('/app/reports'); // Redirect if report fetch fails
		} finally {
			setIsLoading(false);
		}
	};

	// --- Render Financial Report with Unique Bar Colors ---
	const renderFinancialReport = (data: FinancialReportData) => {
		const chartData: ChartDataPoint[] = Object.values(data.revenueByFacility)
			.filter((facility) => !facility.error) // Exclude facilities with errors from chart
			.map((facility) => ({
				name: facility.name,
				value: facility.revenue,
				fill: uniqolor(facility.name, {
					lightness: [50, 60],
					saturation: [80, 90]
				}).color // Generate color
			}));

		return (
			<>
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Celkové příjmy</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							{data.totalRevenue.toLocaleString('cs-CZ', {
								style: 'currency',
								currency: 'CZK'
							})}
						</p>
					</CardContent>
				</Card>

				{/* Revenue by Facility Chart */}
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Příjmy dle sportoviště (Graf)</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={{}} className="min-h-[200px] w-full">
							<BarChart data={chartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" horizontal={false} />
								<XAxis type="number" dataKey="value" />
								<YAxis type="category" dataKey="name" width={100} />
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent hideLabel />}
								/>
								<Bar dataKey="value" radius={4}>
									{/* Map data to render cells with unique fills */}
									{chartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
									<LabelList
										position="right"
										offset={8}
										className="fill-foreground"
										fontSize={12}
										formatter={(value: number) =>
											value.toLocaleString('cs-CZ', {
												style: 'currency',
												currency: 'CZK',
												maximumFractionDigits: 0
											})
										}
									/>
								</Bar>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Revenue by Facility Table (kept for details and errors) */}
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Příjmy dle sportoviště (Tabulka)</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Sportoviště</TableHead>
									<TableHead className="text-right">Příjem</TableHead>
									<TableHead>Chyba</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Object.entries(data.revenueByFacility).map(
									([id, facilityData]) => (
										<TableRow key={id}>
											<TableCell>{facilityData.name}</TableCell>
											<TableCell className="text-right">
												{facilityData.revenue.toLocaleString('cs-CZ', {
													style: 'currency',
													currency: 'CZK'
												})}
											</TableCell>
											<TableCell>
												{facilityData.error && (
													<Badge variant="destructive">Chyba</Badge>
												)}
											</TableCell>
										</TableRow>
									)
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</>
		);
	};

	// --- Render Usage Report with Unique Bar Colors ---
	const renderUsageReport = (data: UsageReportData) => {
		const facilityChartData: ChartDataPoint[] = Object.values(
			data.reservationsByFacility
		).map((facility) => ({
			name: facility.name,
			value: facility.count,
			fill: uniqolor(facility.name, {
				lightness: [50, 60],
				saturation: [80, 90]
			}).color
		}));

		const activityChartData: ChartDataPoint[] = Object.values(
			data.reservationsByActivity
		).map((activity) => ({
			name: activity.name,
			value: activity.count,
			fill: uniqolor(activity.name, {
				lightness: [50, 60],
				saturation: [80, 90]
			}).color
		}));

		return (
			<>
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Celkový počet rezervací</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{data.totalReservations}</p>
					</CardContent>
				</Card>
				<div className="mt-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
					{/* Reservations by Facility Chart */}
					<Card>
						<CardHeader>
							<CardTitle>Rezervace dle sportoviště</CardTitle>
						</CardHeader>
						<CardContent>
							<ChartContainer config={{}} className="min-h-[200px] w-full">
								<BarChart data={facilityChartData} layout="vertical">
									<CartesianGrid strokeDasharray="3 3" horizontal={false} />
									<XAxis type="number" dataKey="value" />
									<YAxis type="category" dataKey="name" width={100} />
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent hideLabel />}
									/>
									<Bar dataKey="value" radius={4}>
										{facilityChartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.fill} />
										))}
										<LabelList
											position="right"
											offset={8}
											className="fill-foreground"
											fontSize={12}
										/>
									</Bar>
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>
					{/* Reservations by Activity Chart */}
					<Card>
						<CardHeader>
							<CardTitle>Rezervace dle aktivity</CardTitle>
						</CardHeader>
						<CardContent>
							<ChartContainer config={{}} className="min-h-[200px] w-full">
								<BarChart data={activityChartData} layout="vertical">
									<CartesianGrid strokeDasharray="3 3" horizontal={false} />
									<XAxis type="number" dataKey="value" />
									<YAxis type="category" dataKey="name" width={100} />
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent hideLabel />}
									/>
									<Bar dataKey="value" radius={4}>
										{activityChartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.fill} />
										))}
										<LabelList
											position="right"
											offset={8}
											className="fill-foreground"
											fontSize={12}
										/>
									</Bar>
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
				{/* Keep tables for detailed view if needed, or remove them */}
				{/* ... tables for usage report ... */}
			</>
		);
	};

	if (isLoading || authLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isAdmin) {
		// Redirect should have already happened in useEffect, but keep this as fallback
		return <div>Přístup odepřen.</div>;
	}

	if (!report) {
		return <div>Report nebyl nalezen nebo se nepodařilo načíst data.</div>;
	}

	// Determine date range from reportData
	const reportStartDate = report.reportData?.startDate
		? format(new Date(report.reportData.startDate), 'dd.MM.yyyy', {
				locale: cs
			})
		: 'N/A';
	const reportEndDate = report.reportData?.endDate
		? format(new Date(report.reportData.endDate), 'dd.MM.yyyy', { locale: cs })
		: 'N/A';

	return (
		<div className="space-y-4">
			<div>
				<Button variant="outline" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Zpět na seznam reportů
				</Button>
			</div>
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle>{report.title}</CardTitle>
							<CardDescription>{report.description || ''}</CardDescription>
						</div>
						<Badge variant="secondary">{report.reportType}</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4 text-sm">
						Období: {reportStartDate} - {reportEndDate}
					</p>
					{/* Render specific report data based on type */}
					{report.reportType === 'FINANCIAL' &&
						renderFinancialReport(report.reportData as FinancialReportData)}
					{report.reportType === 'USAGE' &&
						renderUsageReport(report.reportData as UsageReportData)}
					{report.reportType !== 'FINANCIAL' &&
						report.reportType !== 'USAGE' && (
							<pre className="bg-muted mt-4 overflow-x-auto rounded-md p-4 text-sm">
								{JSON.stringify(report.reportData, null, 2)}
							</pre>
						)}
				</CardContent>
				<CardFooter className="text-muted-foreground text-xs">
					Vygenerováno uživatelem {report.user.firstName} {report.user.lastName}{' '}
					dne{' '}
					{format(new Date(report.generatedAt), 'dd.MM.yyyy HH:mm', {
						locale: cs
					})}
				</CardFooter>
			</Card>
		</div>
	);
}
