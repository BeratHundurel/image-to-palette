import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Color } from './types/palette';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// === Canvas Utilities ===

/**
 * Creates a blob from a canvas element, handling both HTMLCanvasElement and OffscreenCanvas
 */
export function createBlobFromCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
	if ('convertToBlob' in canvas) {
		return (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
	}
	return new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), 'image/png'));
}

/**
 * Calculates mouse position relative to canvas, accounting for scaling
 */
export function getMousePos(
	event: MouseEvent,
	canvas: HTMLCanvasElement,
	dragRect: DOMRect | null = null,
	dragScaleX = 1,
	dragScaleY = 1
) {
	const rect = dragRect ?? canvas.getBoundingClientRect();
	const scaleX = dragRect ? dragScaleX : canvas.width / rect.width;
	const scaleY = dragRect ? dragScaleY : canvas.height / rect.height;
	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY
	};
}

/**
 * Calculates optimal image dimensions while maintaining aspect ratio within constraints
 */
export function calculateImageDimensions(
	originalWidth: number,
	originalHeight: number,
	maxWidth = 800,
	maxHeight = 400
) {
	let imgWidth = originalWidth;
	let imgHeight = originalHeight;
	const aspectRatio = imgWidth / imgHeight;

	if (imgWidth > maxWidth || imgHeight > maxHeight) {
		if (aspectRatio > 1) {
			imgWidth = maxWidth;
			imgHeight = maxWidth / aspectRatio;
			if (imgHeight > maxHeight) {
				imgHeight = maxHeight;
				imgWidth = maxHeight * aspectRatio;
			}
		} else {
			imgHeight = maxHeight;
			imgWidth = maxHeight * aspectRatio;
			if (imgWidth > maxWidth) {
				imgWidth = maxWidth;
				imgHeight = maxWidth / aspectRatio;
			}
		}
	}

	return {
		width: imgWidth,
		height: imgHeight,
		scaleX: originalWidth / imgWidth,
		scaleY: originalHeight / imgHeight
	};
}

// === Clipboard Utilities ===

/**
 * Copies text to clipboard and shows success message
 */
export async function copyToClipboard(text: string, successCallback?: (message: string) => void) {
	try {
		await navigator.clipboard.writeText(text);
		successCallback?.('Copied to clipboard');
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		throw new Error('Failed to copy to clipboard');
	}
}

// === Local Storage Utilities ===

/**
 * Gets saved palette file names from localStorage
 */
export function getSavedPaletteNames(): string[] {
	try {
		const stored = localStorage.getItem('savedPalettes');
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

/**
 * Saves palette file names to localStorage
 */
export function savePaletteNames(fileNames: string[]): void {
	try {
		localStorage.setItem('savedPalettes', JSON.stringify(fileNames));
	} catch (error) {
		console.error('Failed to save palette names to localStorage:', error);
	}
}

/**
 * Adds a new palette file name to the saved list if it doesn't already exist
 */
export function addSavedPaletteName(fileName: string): void {
	const currentNames = getSavedPaletteNames();
	if (!currentNames.includes(fileName)) {
		currentNames.push(fileName);
		savePaletteNames(currentNames);
	}
}

// === Canvas Creation Utilities ===

/**
 * Creates a canvas element with specified dimensions, handling OffscreenCanvas when available
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
	if (typeof OffscreenCanvas !== 'undefined') {
		return new OffscreenCanvas(width, height);
	} else {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}
}
