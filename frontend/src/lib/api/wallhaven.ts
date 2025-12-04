import { buildURL, ensureOk } from './base';
import type { QueryParamValue } from './base';
import type { WallhavenSearchResponse } from '$lib/types/wallhaven';

export async function searchWallhaven(params: Record<string, QueryParamValue>): Promise<WallhavenSearchResponse> {
	const url = buildURL('/wallhaven/search', params)
	const res = await fetch(url);
	await ensureOk(res);
	return res.json() as Promise<WallhavenSearchResponse>;
}

export async function getWallpaper(id: string) {
	const res = await fetch(buildURL(`/wallhaven/w/${encodeURIComponent(id)}`));
	await ensureOk(res);
	return res.json();
}

export async function downloadImage(imageUrl: string): Promise<Blob> {
	const res = await fetch(buildURL('/wallhaven/download', { url: imageUrl }));
	await ensureOk(res);
	return res.blob();
}
