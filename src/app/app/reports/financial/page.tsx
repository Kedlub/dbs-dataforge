'use client';

import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Zod schema for form validation
const financialReportSchema = z
	.object({
		title: z.string().min(1, 'Název reportu je povinný.'),
		description: z.string().optional(),
		startDate: z.date({ required_error: 'Počáteční datum je povinné.' }),
		endDate: z.date({ required_error: 'Koncové datum je povinné.' })
		// TODO: Add facility selection later if needed
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: 'Koncové datum nesmí být dříve než počáteční datum.',
		path: ['endDate']
	});

type FinancialReportFormData = z.infer<typeof financialReportSchema>;

export default function FinancialReportPage() {
	const { isAdmin, isLoading: authLoading } = useAuth();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<FinancialReportFormData>({
		resolver: zodResolver(financialReportSchema)
	});

	const onSubmit = async (data: FinancialReportFormData) => {
		setIsSubmitting(true);
		try {
			const payload = {
				...data,
				reportType: 'FINANCIAL',
				startDate: data.startDate.toISOString(),
				endDate: data.endDate.toISOString()
			};
			await axios.post('/api/reports/generate', payload);
			toast.success('Finanční report byl úspěšně zařazen ke generování.');
			router.push('/app/reports');
		} catch (error) {
			console.error('Failed to generate financial report:', error);
			toast.error('Nepodařilo se vygenerovat finanční report.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (authLoading) {
		return <div>Načítání...</div>;
	}

	if (!isAdmin) {
		return (
			<div>Přístup odepřen. Tato stránka je pouze pro administrátory.</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Generovat Finanční Report</CardTitle>
				<CardDescription>
					Zadejte parametry pro nový finanční report.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Název reportu</FormLabel>
									<FormControl>
										<Input placeholder="Např. Finance Leden 2025" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Popis (nepovinné)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Krátký popis obsahu reportu..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem className="flex w-full flex-col">
										<FormLabel>Počáteční datum</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={'outline'}
														className={cn(
															'pl-3 text-left font-normal',
															!field.value && 'text-muted-foreground'
														)}
													>
														{field.value ? (
															format(field.value, 'PPP', { locale: cs })
														) : (
															<span>Vyberte datum</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date('1900-01-01')
													}
													initialFocus
													locale={cs}
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem className="flex w-full flex-col">
										<FormLabel>Koncové datum</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={'outline'}
														className={cn(
															'pl-3 text-left font-normal',
															!field.value && 'text-muted-foreground'
														)}
													>
														{field.value ? (
															format(field.value, 'PPP', { locale: cs })
														) : (
															<span>Vyberte datum</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date('1900-01-01')
													}
													initialFocus
													locale={cs}
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* TODO: Add facility selector here later if needed */}

						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Vygenerovat Finanční Report
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
