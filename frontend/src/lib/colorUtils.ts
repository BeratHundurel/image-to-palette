import toast from 'svelte-french-toast';
import type { Color } from './types/palette';

export type HarmonyScheme = 'complementary' | 'triadic' | 'analogous' | 'split-complementary';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	if (!hex || typeof hex !== 'string') {
		toast.error(`Invalid hex color: ${hex}`);
		return { r: 0, g: 0, b: 0 };
	}
	const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

	if (cleanHex.length !== 6 || !/^[a-f\d]{6}$/i.test(cleanHex)) {
		toast.error(`Invalid hex color format: ${hex}`);
		return { r: 0, g: 0, b: 0 };
	}

	const num = parseInt(cleanHex, 16);
	return {
		r: (num >> 16) & 0xff,
		g: (num >> 8) & 0xff,
		b: num & 0xff
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

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	let r: number, g: number, b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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

export function darken(hex: string, percent: number): string {
	const num = parseInt(hex.startsWith('#') ? hex.slice(1) : hex, 16);
	const factor = 1 - percent;
	const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * factor));
	const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * factor));
	const b = Math.max(0, Math.floor((num & 0xff) * factor));
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function lighten(hex: string, percent: number): string {
	const num = parseInt(hex.startsWith('#') ? hex.slice(1) : hex, 16);
	const r = Math.min(255, Math.floor(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * percent));
	const g = Math.min(255, Math.floor(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * percent));
	const b = Math.min(255, Math.floor((num & 0xff) + (255 - (num & 0xff)) * percent));
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function addAlpha(hex: string, alpha: string): string {
	return `${hex}${alpha}`;
}

export function contrastRatio(hex1: string, hex2: string): number {
	const L1 = getLuminance(hex1);
	const L2 = getLuminance(hex2);
	const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
	return (hi + 0.05) / (lo + 0.05);
}

export function isDarkColor(hex: string): boolean {
	const { r, g, b } = hexToRgb(hex);
	const brightness = (r * 299 + g * 587 + b * 114) / 255000;
	return brightness < 0.5;
}

export function rgbDistance(hex1: string, hex2: string): number {
	const num1 = parseInt(hex1.startsWith('#') ? hex1.slice(1) : hex1, 16);
	const num2 = parseInt(hex2.startsWith('#') ? hex2.slice(1) : hex2, 16);

	const dr = ((num1 >> 16) & 0xff) - ((num2 >> 16) & 0xff);
	const dg = ((num1 >> 8) & 0xff) - ((num2 >> 8) & 0xff);
	const db = (num1 & 0xff) - (num2 & 0xff);

	return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function adjustForContrast(hex: string, background: string, minContrast = 4.5, maxIterations = 10): string {
	let color = hex;
	let iterations = 0;
	const darkBg = isDarkColor(background);

	while (contrastRatio(color, background) < minContrast && iterations++ < maxIterations) {
		color = darkBg ? lighten(color, 0.1) : darken(color, 0.1);
	}

	return color;
}

export function ensureReadableContrast(proposedColor: string, background: string, minContrast = 4.5): string {
	if (contrastRatio(proposedColor, background) >= minContrast) {
		return proposedColor;
	}
	const black = '#000000';
	const white = '#ffffff';
	return contrastRatio(white, background) >= contrastRatio(black, background) ? white : black;
}

export function selectDiverseColors(colors: string[], count: number): string[] {
	if (colors.length === 0) {
		return [];
	}

	if (colors.length <= count) {
		return colors;
	}

	const selected: string[] = [colors[0]];
	let safetyCounter = 0;
	const maxIterations = count * colors.length;

	while (selected.length < count && safetyCounter++ < maxIterations) {
		let maxMinDistance = 0;
		let bestCandidate: string | null = null;

		for (const candidate of colors) {
			if (selected.includes(candidate)) continue;

			const minDistance = Math.min(...selected.map((s) => rgbDistance(candidate, s)));

			if (minDistance > maxMinDistance) {
				maxMinDistance = minDistance;
				bestCandidate = candidate;
			}
		}

		if (bestCandidate === null) {
			break;
		}

		selected.push(bestCandidate);
	}

	return selected;
}

export interface PaletteQualityScore {
	score: number;
	minDistance: number;
	avgDistance: number;
	poorPairs: Array<{ color1: string; color2: string; distance: number }>;
	isGoodQuality: boolean;
}

export function calculatePaletteQuality(colors: string[]): PaletteQualityScore {
	if (colors.length < 2) {
		return {
			score: 100,
			minDistance: 0,
			avgDistance: 0,
			poorPairs: [],
			isGoodQuality: true
		};
	}

	const distances: number[] = [];
	const poorPairs: Array<{ color1: string; color2: string; distance: number }> = [];
	const POOR_THRESHOLD = 50;

	for (let i = 0; i < colors.length; i++) {
		for (let j = i + 1; j < colors.length; j++) {
			const dist = rgbDistance(colors[i], colors[j]);
			distances.push(dist);

			if (dist < POOR_THRESHOLD) {
				poorPairs.push({
					color1: colors[i],
					color2: colors[j],
					distance: dist
				});
			}
		}
	}

	const minDistance = Math.min(...distances);
	const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

	const score = Math.min(100, (minDistance / 100) * 50 + (avgDistance / 150) * 50);

	return {
		score: Math.round(score),
		minDistance: Math.round(minDistance),
		avgDistance: Math.round(avgDistance),
		poorPairs: poorPairs.sort((a, b) => a.distance - b.distance),
		isGoodQuality: score >= 60 && minDistance >= 40
	};
}

export function generateHarmonyColors(baseColor: string, scheme: HarmonyScheme = 'triadic'): string[] {
	const hsl = hexToHsl(baseColor);
	const colors: string[] = [baseColor];

	switch (scheme) {
		case 'complementary': {
			// Opposite color on the wheel (180° or 0.5 in normalized hue)
			const compH = (hsl.h + 0.5) % 1;
			const rgb = hslToRgb(compH, hsl.s, hsl.l);
			colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
			break;
		}
		case 'triadic': {
			// Two colors at 120° (1/3) and 240° (2/3) from the base
			for (const offset of [1 / 3, 2 / 3]) {
				const h = (hsl.h + offset) % 1;
				const rgb = hslToRgb(h, hsl.s, hsl.l);
				colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
			}
			break;
		}
		case 'analogous': {
			// Two colors at -30° (-1/12) and +30° (+1/12) from the base
			for (const offset of [-1 / 12, 1 / 12]) {
				const h = (hsl.h + offset + 1) % 1;
				const rgb = hslToRgb(h, hsl.s, hsl.l);
				colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
			}
			break;
		}
		case 'split-complementary': {
			// Complement at 180°, then -30° and +30° from the complement
			const compH = (hsl.h + 0.5) % 1;
			for (const offset of [-1 / 12, 1 / 12]) {
				const h = (compH + offset + 1) % 1;
				const rgb = hslToRgb(h, hsl.s, hsl.l);
				colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
			}
			break;
		}
	}

	return colors;
}

export function improvePaletteQuality(
	colors: string[],
	targetCount = 12,
	harmonyScheme: HarmonyScheme = 'triadic'
): string[] {
	// Limit working set to prevent performance issues with large palettes
	const maxWorkingSize = Math.min(50, colors.length);
	const workingColors = colors.length > maxWorkingSize ? selectDiverseColors(colors, maxWorkingSize) : colors;

	const quality = calculatePaletteQuality(workingColors);

	if (quality.isGoodQuality && workingColors.length >= targetCount) {
		return selectDiverseColors(workingColors, targetCount);
	}

	const uniqueColors = Array.from(new Set(workingColors));

	if (uniqueColors.length === 0) {
		return [];
	}

	if (uniqueColors.length >= targetCount) {
		return selectDiverseColors(uniqueColors, targetCount);
	}

	let improved = [...uniqueColors];

	if (quality.poorPairs.length > 0) {
		const problematicColors = new Set<string>();
		quality.poorPairs.slice(0, 2).forEach((pair) => {
			problematicColors.add(pair.color1);
		});

		improved = improved.filter((c) => !problematicColors.has(c));

		if (improved.length === 0) {
			improved = [...uniqueColors];
		}

		if (improved.length < targetCount && improved.length < 100) {
			const baseCount = Math.min(2, improved.length);
			if (baseCount > 0) {
				const basesForHarmony = selectDiverseColors(improved, baseCount);

				for (const base of basesForHarmony) {
					if (improved.length >= targetCount * 2) break;

					try {
						const harmonyColors = generateHarmonyColors(base, harmonyScheme);
						const newColors = harmonyColors.slice(1).filter((c) => !improved.includes(c));

						if (newColors.length > 0 && improved.length + newColors.length < 200) {
							improved.push(...newColors);
						}
					} catch (error) {
						console.error('Error generating harmony colors:', error);
						break;
					}
				}
			}
		}
	}

	if (improved.length < targetCount) {
		const mostDiverse = selectDiverseColors(uniqueColors, Math.min(targetCount, uniqueColors.length));
		improved.push(...mostDiverse.filter((c) => !improved.includes(c)));
	}

	improved = Array.from(new Set(improved));

	if (improved.length === 0) {
		return uniqueColors.slice(0, targetCount);
	}

	return selectDiverseColors(improved, Math.min(targetCount, improved.length));
}

export type SortMethod = 'hue' | 'saturation' | 'lightness' | 'luminance' | 'none';

export interface SortResult {
	colors: Array<Color>;
	hadNoChange: boolean;
}

export function sortColorsByMethod(colors: Array<Color>, method: SortMethod): SortResult {
	if (method === 'none') return { colors, hadNoChange: false };

	const sorted = [...colors].sort((a, b) => {
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

	const hadNoChange = checkSortChange(colors, sorted);

	return { colors: sorted, hadNoChange };
}

function checkSortChange(original: Array<Color>, sorted: Array<Color>): boolean {
	if (original.length !== sorted.length || original.length === 0) return false;

	for (let i = 0; i < original.length; i++) {
		if (original[i].hex !== sorted[i].hex) {
			return false;
		}
	}

	return true;
}
