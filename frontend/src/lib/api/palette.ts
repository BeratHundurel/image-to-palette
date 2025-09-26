import type {
	Color,
	PaletteResponse,
	SavePaletteRequest,
	GetPalettesResponse,
	SavePaletteResult
} from '$lib/types/palette';

import { getAuthHeaders } from './auth';

export const API_BASE: string =
	(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:8088';

function buildURL(path: string, params?: Record<string, string | number | boolean | undefined>): string {
	const url = new URL(path, API_BASE);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) url.searchParams.set(k, String(v));
		}
	}
	return url.toString();
}

async function ensureOk(res: Response): Promise<Response> {
	if (!res.ok) {
		let msg = `HTTP ${res.status}`;
		try {
			const data = await res.json().catch(() => null);
			if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
				msg = data.error;
			}
		} catch {
			// ignore JSON parse errors
		}
		throw new Error(msg);
	}
	return res;
}

export type ApplyParams = {
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export async function extractPalette(
	files: (Blob | File)[],
	sampleRate: number,
	filteredColors: string[]
): Promise<PaletteResponse> {
	if (!files?.length) throw new Error('No files provided');

	const formData = new FormData();
	for (const f of files) formData.append('files', f);
	formData.append('sampleRate', String(sampleRate));
	formData.append('filteredColors', JSON.stringify(filteredColors));

	const res = await fetch(buildURL('/extract-palette'), {
		method: 'POST',
		body: formData
	});
	await ensureOk(res);
	return res.json();
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
	const payload: SavePaletteRequest = {
		name,
		palette: colors
	};

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
