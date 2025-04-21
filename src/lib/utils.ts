import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Standard fetcher function for SWR
export const fetcher = (url: string | URL | Request) =>
	fetch(url).then((res) => res.json());
