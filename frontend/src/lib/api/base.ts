export const API_BASE: string =
	(typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8088';

export type QueryParamValue = string | number | boolean | null;
export function buildURL(path: string, params?: Record<string, QueryParamValue>): string {
	const url = new URL(path, API_BASE);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== null) url.searchParams.set(k, String(v));
		}
	}
	return url.toString();
}

export async function ensureOk(res: Response): Promise<Response> {
	if (!res.ok) {
		let msg = `HTTP ${res.status}`;
		try {
			const data = await res.json().catch(() => null);
			if (data && typeof data === 'object') {
				// try to read known error fields
				const obj = data as { error?: string; message?: string };
				if (typeof obj.error === 'string') {
					msg = obj.error;
				} else if (typeof obj.message === 'string') {
					msg = obj.message;
				}
			}
		} catch {
			// ignore JSON parse errors
		}
		throw new Error(msg);
	}
	return res;
}
