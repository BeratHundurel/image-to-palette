import type { Color, SavePaletteRequest, GetPalettesResponse, SavePaletteResult } from '$lib/types/palette';

import { getAuthHeaders } from './auth';
import { buildURL, buildZigURL, ensureOk, ZIG_API_BASE } from './base';

export type ApplyParams = {
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export type ThemeType = 'vscode' | 'zed';

export type GenerateThemeRequest = {
	colors: Color[];
	type: ThemeType;
	name?: string;
};

export type ZigPaletteResponse = {
	palette: Color[];
};

async function extractPaletteFromFile(
	file: Blob | File,
	maxColors: number,
	sampleRate: number
): Promise<ZigPaletteResponse> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('maxColors', String(maxColors));
	formData.append('sampleRate', String(sampleRate));

	let res: Response;
	try {
		res = await fetch(buildZigURL('/extract-palette'), {
			method: 'POST',
			body: formData
		});
	} catch (err) {
		throw new Error(
			`Cannot connect to Zig API server at ${ZIG_API_BASE}. ${err instanceof Error ? err.message : 'Network error'}`
		);
	}

	await ensureOk(res);

	const text = await res.text();
	if (!text) {
		throw new Error('Empty response from Zig API server');
	}

	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
	}
}

export async function extractPalette(
	files: (Blob | File)[],
	maxColors: number = 20,
	sampleRate: number = 4
): Promise<ZigPaletteResponse> {
	if (!files?.length) throw new Error('No files provided');

	const allColors: Color[] = [];
	const seenHex = new Set<string>();

	for (const file of files) {
		const result = await extractPaletteFromFile(file, maxColors, sampleRate);
		for (const color of result.palette) {
			const hex = color.hex.toUpperCase();
			if (!seenHex.has(hex)) {
				seenHex.add(hex);
				allColors.push(color);
			}
		}
	}

	console.log(allColors);
	console.log(seenHex);

	return { palette: allColors.slice(0, maxColors) };
}

export async function generateTheme(colors: Color[], type: ThemeType, name?: string): Promise<Record<string, unknown>> {
	const payload: GenerateThemeRequest = { colors, type, name };

	const res = await fetch(buildZigURL('/generate-theme'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	await ensureOk(res);
	return res.json();
}

export async function downloadTheme(colors: Color[], type: ThemeType, name: string = 'Generated Theme'): Promise<void> {
	const theme = await generateTheme(colors, type, name);
	const json = JSON.stringify(theme, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `${name}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

export async function applyPaletteBlob(imageBlob: Blob, colors: Color[], params: ApplyParams): Promise<Blob> {
	const formData = new FormData();
	formData.append('file', imageBlob, 'image.png');
	formData.append('palette', JSON.stringify(colors.map((c) => c.hex)));
	formData.append('luminosity', String(params.luminosity));
	formData.append('nearest', String(params.nearest));
	formData.append('power', String(params.power));
	formData.append('maxDistance', String(params.maxDistance));

	const res = await fetch(buildURL('/apply-palette'), {
		method: 'POST',
		body: formData
	});
	await ensureOk(res);
	return res.blob();
}

export async function savePalette(name: string, colors: Color[]): Promise<SavePaletteResult> {
	const payload: SavePaletteRequest = { name, palette: colors };

	const res = await fetch(buildURL('/palettes'), {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	await ensureOk(res);
	return res.json();
}

export async function getPalettes(): Promise<GetPalettesResponse> {
	const res = await fetch(buildURL('/palettes'), {
		method: 'GET',
		headers: getAuthHeaders()
	});
	await ensureOk(res);
	return res.json();
}

export async function deletePalette(id: string): Promise<{ message: string }> {
	const res = await fetch(buildURL(`/palettes/${id}`), {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	await ensureOk(res);
	return res.json();
}
