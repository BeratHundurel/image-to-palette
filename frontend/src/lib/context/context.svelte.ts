import { getContext, hasContext, setContext } from 'svelte';
import { createPaletteActions, type PaletteActions } from './palette/actions.svelte';
import { createCanvasActions, type CanvasActions } from './canvas/actions.svelte';
import { createUploadActions, type UploadActions } from './upload/upload.svelte';
import {
	type AppState,
	type PaletteState,
	type CanvasState,
	type ExtractionState,
	type UIState,
	type SavedPaletteItem,
	createAppStateInitializer
} from './state.svelte';

export type AppActions = {
	palette: PaletteActions;
	canvas: CanvasActions;
	upload: UploadActions;
};

export type AppContext = {
	state: AppState;
	actions: AppActions;
};

export type { AppState, PaletteState, CanvasState, ExtractionState, UIState, SavedPaletteItem };

export const APP_CONTEXT_KEY = Symbol('app-context');

export function setAppContext(ctx: AppContext) {
	setContext(APP_CONTEXT_KEY, ctx);
}

export function getAppContext(): AppContext {
	return getContext(APP_CONTEXT_KEY) as AppContext;
}

export function hasToolbar(): boolean {
	return hasContext(APP_CONTEXT_KEY);
}

export function createAppActions(context: AppContext): AppActions {
	const actions = {} as AppActions;
	context.actions = actions;

	actions.canvas = createCanvasActions(context);
	actions.palette = createPaletteActions(context);
	actions.upload = createUploadActions(context);

	return actions;
}

export function createAppContext(initial?: Partial<AppState>): AppContext {
	const state = $state<AppState>(createAppStateInitializer(initial));
	const ctx: AppContext = { state, actions: {} as AppActions };
	ctx.actions = createAppActions(ctx);
	return ctx;
}
