'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DateTimePickerProps {
	value: Date | undefined;
	onChange: (date: Date | undefined) => void;
	className?: string;
}

export function DateTimePicker24h({
	value,
	onChange,
	className
}: DateTimePickerProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	const hours = Array.from({ length: 24 }, (_, i) => i);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			const newDateTime = value ? new Date(value) : new Date(selectedDate);
			newDateTime.setFullYear(selectedDate.getFullYear());
			newDateTime.setMonth(selectedDate.getMonth());
			newDateTime.setDate(selectedDate.getDate());
			if (!value) {
				newDateTime.setHours(0);
				newDateTime.setMinutes(0);
				newDateTime.setSeconds(0);
				newDateTime.setMilliseconds(0);
			}
			onChange(newDateTime);
		}
	};

	const handleTimeChange = (type: 'hour' | 'minute', timeValue: string) => {
		const newDate = value ? new Date(value) : new Date();
		if (!value) {
			const today = new Date();
			newDate.setFullYear(today.getFullYear());
			newDate.setMonth(today.getMonth());
			newDate.setDate(today.getDate());
		}

		if (type === 'hour') {
			newDate.setHours(parseInt(timeValue));
		} else if (type === 'minute') {
			newDate.setMinutes(parseInt(timeValue));
		}
		onChange(newDate);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'w-full justify-start text-left font-normal',
						!value && 'text-muted-foreground',
						className
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? (
						format(value, 'd. M. yyyy HH:mm', { locale: cs })
					) : (
						<span>Vyberte datum a čas</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<div className="sm:flex">
					<Calendar
						mode="single"
						selected={value}
						onSelect={handleDateSelect}
						initialFocus
					/>
					<div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
						<ScrollArea className="h-32 sm:h-auto sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{hours.map((hour) => (
									<Button
										key={hour}
										size="sm"
										variant={
											value && value.getHours() === hour ? 'default' : 'ghost'
										}
										className="w-full justify-center px-2"
										onClick={() => handleTimeChange('hour', hour.toString())}
									>
										{hour.toString().padStart(2, '0')}:00
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
							<ScrollBar orientation="vertical" className="hidden sm:flex" />
						</ScrollArea>
						<ScrollArea className="h-32 sm:h-auto sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="sm"
										variant={
											value && value.getMinutes() === minute
												? 'default'
												: 'ghost'
										}
										className="w-full justify-center px-2"
										onClick={() =>
											handleTimeChange('minute', minute.toString())
										}
									>
										:{minute.toString().padStart(2, '0')}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
							<ScrollBar orientation="vertical" className="hidden sm:flex" />
						</ScrollArea>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
