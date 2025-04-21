'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';

interface DatePickerSingleProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	className?: string;
	placeholder?: string;
	disabled?: boolean;
}

export function DatePickerSingle({
	date,
	setDate,
	className,
	placeholder = 'Vyberte datum',
	disabled = false
}: DatePickerSingleProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'w-[280px] justify-start text-left font-normal',
						!date && 'text-muted-foreground',
						className,
						disabled && 'cursor-not-allowed'
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? (
						format(date, 'PPP', { locale: cs })
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={date}
					onSelect={setDate}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
