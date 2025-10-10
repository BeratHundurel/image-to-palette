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

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace(/^#/, '');

	if (!/^[a-f\d]{6}$/i.test(cleanHex)) {
		throw new Error(`Invalid hex color format: ${hex}`);
	}

	const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);

	if (!result) {
		throw new Error(`Failed to parse hex color: ${hex}`);
	}

	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	};
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return { h, s, l };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const { r, g, b } = hexToRgb(hex);
	return rgbToHsl(r, g, b);
}

export function getLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);

	const rsRGB = r / 255;
	const gsRGB = g / 255;
	const bsRGB = b / 255;

	const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
	const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
	const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

	return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export type SortMethod = 'hue' | 'saturation' | 'lightness' | 'luminance' | 'none';

export function sortColorsByMethod(colors: Array<{ hex: string; count?: number }>, method: SortMethod) {
	if (method === 'none') return colors;

	return [...colors].sort((a, b) => {
		switch (method) {
			case 'hue': {
				const hslA = hexToHsl(a.hex);
				const hslB = hexToHsl(b.hex);
				return hslA.h - hslB.h;
			}
			case 'saturation': {
				const hslA = hexToHsl(a.hex);
				const hslB = hexToHsl(b.hex);
				return hslB.s - hslA.s;
			}
			case 'lightness': {
				const hslA = hexToHsl(a.hex);
				const hslB = hexToHsl(b.hex);
				return hslA.l - hslB.l;
			}
			case 'luminance': {
				const lumA = getLuminance(a.hex);
				const lumB = getLuminance(b.hex);
				return lumA - lumB;
			}
			default:
				return 0;
		}
	});
}
