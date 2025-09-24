import { browser } from '$app/environment';
import type { User } from '$lib/api/auth';
import * as authApi from '$lib/api/auth';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

function createAuthStore() {
	let state = $state<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true
	});

	return {
		get state() {
			return state;
		},

		async init() {
			if (!browser) return;

			state.isLoading = true;

			try {
				if (authApi.isAuthenticated()) {
					const { user } = await authApi.getCurrentUser();
					state = {
						user,
						isAuthenticated: true,
						isLoading: false
					};
				} else {
					state = {
						user: null,
						isAuthenticated: false,
						isLoading: false
					};
				}
			} catch (error) {
				authApi.removeAuthToken();
				state = {
					user: null,
					isAuthenticated: false,
					isLoading: false
				};
			}
		},

		async login(email: string, password: string) {
			state.isLoading = true;

			try {
				const response = await authApi.login({ email, password });
				state = {
					user: response.user,
					isAuthenticated: true,
					isLoading: false
				};
				return response;
			} catch (error) {
				state.isLoading = false;
				throw error;
			}
		},

		async register(name: string, email: string, password: string) {
			state.isLoading = true;

			try {
				const response = await authApi.register({ name, email, password });
				state = {
					user: response.user,
					isAuthenticated: true,
					isLoading: false
				};
				return response;
			} catch (error) {
				state.isLoading = false;
				throw error;
			}
		},

		async logout() {
			await authApi.logout();
			state = {
				user: null,
				isAuthenticated: false,
				isLoading: false
			};
		},

		setUser(user: User) {
			state.user = user;
		}
	};
}

export const authStore = createAuthStore();
