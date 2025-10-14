import { getAuthHeaders } from './auth';
import type {
	SaveWorkspaceRequest,
	GetWorkspacesResponse,
	SaveWorkspaceResult,
	ShareWorkspaceResult,
	WorkspaceData
} from '$lib/types/palette';

const BASE_URL = 'http://localhost:8088';

async function ensureOk(response: Response) {
	if (!response.ok) {
		const text = await response.text();
		let errorMessage = 'Request failed';
		try {
			const json = JSON.parse(text);
			errorMessage = json.error || json.message || errorMessage;
		} catch {
			errorMessage = text || errorMessage;
		}
		throw new Error(errorMessage);
	}
}

export async function saveWorkspace(
	name: string,
	imageData: string,
	workspaceState: Omit<SaveWorkspaceRequest, 'name' | 'imageData'>
): Promise<SaveWorkspaceResult> {
	const response = await fetch(`${BASE_URL}/workspaces`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({
			name,
			imageData,
			...workspaceState
		})
	});

	await ensureOk(response);
	return response.json();
}

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
	const response = await fetch(`${BASE_URL}/workspaces`, {
		method: 'GET',
		headers: getAuthHeaders()
	});

	await ensureOk(response);
	return response.json();
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/workspaces/${workspaceId}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});

	await ensureOk(response);
}

export async function shareWorkspace(workspaceId: string): Promise<ShareWorkspaceResult> {
	const response = await fetch(`${BASE_URL}/workspaces/${workspaceId}/share`, {
		method: 'POST',
		headers: getAuthHeaders()
	});

	await ensureOk(response);
	return response.json();
}

export async function removeWorkspaceShare(workspaceId: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/workspaces/${workspaceId}/share`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});

	await ensureOk(response);
}

export async function getSharedWorkspace(shareToken: string): Promise<WorkspaceData> {
	const response = await fetch(`${BASE_URL}/shared?token=${encodeURIComponent(shareToken)}`, {
		method: 'GET'
	});

	await ensureOk(response);
	return response.json();
}
