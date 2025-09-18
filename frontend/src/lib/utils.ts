import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Re-export canvas utilities from their new location
export { createBlobFromCanvas, getMousePos, calculateImageDimensions, createCanvas } from './context/canvas';

// Re-export palette storage utilities from their new location
export { getSavedPaletteNames, savePaletteNames, addSavedPaletteName } from './context/palette';

// Combines class names using clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Copies text to clipboard and shows success message
export async function copyToClipboard(text: string, successCallback?: (message: string) => void) {
	try {
		await navigator.clipboard.writeText(text);
		successCallback?.('Copied to clipboard');
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		throw new Error('Failed to copy to clipboard');
	}
}

// Prevents default behavior of an event
export function preventDefault(event: Event) {
	event.preventDefault();
}
