import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string, successCallback?: (message: string) => void) {
	try {
		await navigator.clipboard.writeText(text);
		successCallback?.('Copied to clipboard');
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		throw new Error('Failed to copy to clipboard');
	}
}

export function preventDefault(event: Event) {
	event.preventDefault();
}
