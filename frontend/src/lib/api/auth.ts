import { buildURL, ensureOk } from './base';

export interface User {
	id: number;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	token: string;
	user: User;
	message: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface ChangePasswordRequest {
	current_password: string;
	new_password: string;
}

export function getAuthToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem('authToken');
}

export function isAuthenticated(): boolean {
	return getAuthToken() !== null;
}

export function getAuthHeaders(): Record<string, string> {
	const token = getAuthToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
}

async function handleAuthResponse<T>(response: Response): Promise<T> {
	await ensureOk(response);
	return response.json() as Promise<T>;
}

export async function register(userData: RegisterRequest): Promise<AuthResponse> {
	const response = await fetch(buildURL('/auth/register'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userData)
	});

	const data = await handleAuthResponse<AuthResponse>(response);

	if (data.token) setAuthToken(data.token);

	return data;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
	const response = await fetch(buildURL('/auth/login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	});

	const data = await handleAuthResponse<AuthResponse>(response);
	if (data.token) setAuthToken(data.token);
	return data;
}

export async function logout(): Promise<void> {
	removeAuthToken();
}

export async function getCurrentUser(): Promise<{ user: User }> {
	const response = await fetch(buildURL('/auth/me'), {
		method: 'GET',
		headers: getAuthHeaders()
	});

	return handleAuthResponse<{ user: User }>(response);
}

export async function changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
	const response = await fetch(buildURL('/auth/change-password'), {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(passwordData)
	});

	return handleAuthResponse<{ message: string }>(response);
}

export async function demoLogin(): Promise<AuthResponse> {
	const response = await fetch(buildURL('/auth/demo-login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});

	const data = await handleAuthResponse<AuthResponse>(response);
	if (data.token) setAuthToken(data.token);
	return data;
}
