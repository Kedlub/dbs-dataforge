'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { DateTimePicker24h } from '@/components/ui/date-time-picker';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';

// Define types for Employee and Shift (could be moved to src/lib/types.ts)
type Employee = {
	id: string; // This is User.id
	firstName: string;
	lastName: string;
	email: string;
};

type Shift = {
	id: string;
	employeeId: string; // Employee.id
	userId: string; // User.id (added)
	employeeName: string;
	startTime: string | Date;
	endTime: string | Date;
	shiftType: string;
};

export default function ShiftPlanningPage() {
	const [shifts, setShifts] = useState<Shift[]>([]);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentShift, setCurrentShift] = useState<Shift | null>(null);

	// Fetch initial data
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [shiftsRes, employeesRes] = await Promise.all([
					fetch('/api/shifts'),
					fetch('/api/employees')
				]);

				if (!shiftsRes.ok || !employeesRes.ok) {
					throw new Error('Failed to fetch data');
				}

				const shiftsData = await shiftsRes.json();
				const employeesData = await employeesRes.json();

				setShifts(shiftsData);
				setEmployees(employeesData);
			} catch (error) {
				console.error('Error fetching data:', error);
				toast.error('Nepodařilo se načíst data směn nebo zaměstnanců.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	// --- Form State for Add/Edit Dialog ---
	const [selectedEmployee, setSelectedEmployee] = useState<string>('');
	const [startTime, setStartTime] = useState<Date | undefined>();
	const [endTime, setEndTime] = useState<Date | undefined>();
	const [shiftType, setShiftType] = useState<string>('');
	// --- End Form State ---

	const resetForm = () => {
		setSelectedEmployee('');
		setStartTime(undefined);
		setEndTime(undefined);
		setShiftType('');
		setCurrentShift(null);
	};

	const handleEditOpen = (shift: Shift) => {
		setCurrentShift(shift);
		setSelectedEmployee(shift.userId); // Use userId to match SelectItem value
		setStartTime(new Date(shift.startTime));
		setEndTime(new Date(shift.endTime));
		setShiftType(shift.shiftType);
		setIsEditDialogOpen(true);
	};

	const handleDeleteOpen = (shift: Shift) => {
		setCurrentShift(shift);
		setIsDeleteDialogOpen(true);
	};

	// --- Submit Handlers ---
	const handleAddOrUpdateShift = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEmployee || !startTime || !endTime || !shiftType) {
			toast.error('Vyplňte prosím všechna pole.');
			return;
		}

		if (endTime <= startTime) {
			toast.error('Čas konce směny musí být po čase začátku.');
			return;
		}

		setIsSubmitting(true);
		const url = currentShift ? `/api/shifts/${currentShift.id}` : '/api/shifts';
		const method = currentShift ? 'PUT' : 'POST';
		const body = JSON.stringify({
			employeeId: selectedEmployee, // API expects user ID
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			shiftType
		});

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error ||
						`Failed to ${currentShift ? 'update' : 'add'} shift`
				);
			}

			toast.success(
				`Směna byla úspěšně ${currentShift ? 'aktualizována' : 'přidána'}.`
			);

			// Refetch shifts to update the table
			const shiftsRes = await fetch('/api/shifts');
			if (shiftsRes.ok) {
				const shiftsData = await shiftsRes.json();
				setShifts(shiftsData);
			}

			setIsEditDialogOpen(false);
			resetForm();
		} catch (error: any) {
			console.error('Error submitting shift:', error);
			toast.error(
				`Chyba při ${currentShift ? 'aktualizaci' : 'přidávání'} směny: ${error.message}`
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteShift = async () => {
		if (!currentShift) return;
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/shifts/${currentShift.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to delete shift');
			}

			toast.success('Směna byla úspěšně smazána.');
			setShifts(shifts.filter((s) => s.id !== currentShift.id)); // Optimistic update
			setIsDeleteDialogOpen(false);
			resetForm();
		} catch (error: any) {
			console.error('Error deleting shift:', error);
			toast.error(`Chyba při mazání směny: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Render Logic ---
	if (isLoading) {
		return <div>Načítání...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Plánování směn</h1>
				<Dialog
					open={isEditDialogOpen}
					onOpenChange={(open) => {
						setIsEditDialogOpen(open);
						if (!open) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button onClick={() => setIsEditDialogOpen(true)}>
							<PlusCircle className="mr-2 h-4 w-4" /> Přidat směnu
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>
								{currentShift ? 'Upravit směnu' : 'Přidat novou směnu'}
							</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleAddOrUpdateShift} className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="employee" className="text-right">
									Zaměstnanec
								</Label>
								<Select
									value={selectedEmployee}
									onValueChange={setSelectedEmployee}
									required
								>
									<SelectTrigger id="employee" className="col-span-3">
										<SelectValue placeholder="Vyberte zaměstnance" />
									</SelectTrigger>
									<SelectContent>
										{employees.map((emp) => (
											<SelectItem key={emp.id} value={emp.id}>
												{emp.firstName} {emp.lastName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="start-time" className="text-right">
									Začátek
								</Label>
								<DateTimePicker24h
									value={startTime}
									onChange={setStartTime}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="end-time" className="text-right">
									Konec
								</Label>
								<DateTimePicker24h
									value={endTime}
									onChange={setEndTime}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="shift-type" className="text-right">
									Typ směny
								</Label>
								<Input
									id="shift-type"
									value={shiftType}
									onChange={(e) => setShiftType(e.target.value)}
									className="col-span-3"
									placeholder="např. Ranní, Odpolední, Úklid"
									required
								/>
							</div>
							<DialogFooter>
								<Button
									type="submit"
									disabled={isSubmitting || !startTime || !endTime}
								>
									{isSubmitting
										? 'Ukládání...'
										: currentShift
											? 'Uložit změny'
											: 'Přidat směnu'}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Naplánované směny</CardTitle>
					<CardDescription>
						Přehled všech naplánovaných směn zaměstnanců.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Zaměstnanec</TableHead>
								<TableHead>Začátek</TableHead>
								<TableHead>Konec</TableHead>
								<TableHead>Typ směny</TableHead>
								<TableHead className="text-right">Akce</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{shifts.length > 0 ? (
								shifts.map((shift) => (
									<TableRow key={shift.id}>
										<TableCell>{shift.employeeName}</TableCell>
										<TableCell>
											{format(new Date(shift.startTime), 'Pp', { locale: cs })}
										</TableCell>
										<TableCell>
											{format(new Date(shift.endTime), 'Pp', { locale: cs })}
										</TableCell>
										<TableCell>{shift.shiftType}</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEditOpen(shift)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDeleteOpen(shift)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="text-center">
										Nebyly nalezeny žádné směny.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Opravdu smazat směnu?</DialogTitle>
						<CardDescription>
							Tato akce nemůže být vrácena. Opravdu chcete smazat směnu pro{' '}
							<span className="font-medium">{currentShift?.employeeName}</span>
							od{' '}
							{currentShift
								? format(new Date(currentShift.startTime), 'Pp', { locale: cs })
								: ''}
							do{' '}
							{currentShift
								? format(new Date(currentShift.endTime), 'Pp', { locale: cs })
								: ''}
							?
						</CardDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Zrušit</Button>
						</DialogClose>
						<Button
							variant="destructive"
							onClick={handleDeleteShift}
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Mazání...' : 'Smazat'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
