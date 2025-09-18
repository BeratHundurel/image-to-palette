import type { Color, Selector } from '$lib/types/palette';
import { getContext, hasContext, setContext } from 'svelte';
import { createPaletteActions, type PaletteActions } from './palette/palette.svelte';
import { createCanvasActions, type CanvasActions } from './canvas/canvas.svelte';
import { createUploadActions, type UploadActions } from './upload/upload.svelte';

export type SavedPaletteItem = {
	fileName: string;
	palette: Color[];
};

export type AppState = {
	colors: Color[];
	selectors: Selector[];
	drawSelectionValue: string;
	activeSelectorId: string;
	sampleRate: number;
	newFilterColor: string;
	filteredColors: string[];
	savedPalettes: SavedPaletteItem[];
	loadingSavedPalettes: boolean;
	fileInput: HTMLInputElement | null | undefined;
	canvas: HTMLCanvasElement | null;
	canvasContext: CanvasRenderingContext2D | null;
	image: HTMLImageElement | null;
	dragRect: DOMRect | null;
	originalImageWidth: number;
	originalImageHeight: number;
	canvasScaleX: number;
	canvasScaleY: number;
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
	imageLoaded: boolean;
	isDragging: boolean;
	isExtracting: boolean;
	startX: number;
	startY: number;
	dragScaleX: number;
	dragScaleY: number;
};

export type AppActions = {
	palette: PaletteActions;
	canvas: CanvasActions;
	upload: UploadActions;
};

export type AppContext = {
	state: AppState;
	actions: AppActions;
};

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
	const state = createAppStateInitializer(initial);
	const ctx: AppContext = { state, actions: {} as AppActions };
	ctx.actions = createAppActions(ctx);
	return ctx;
}

export function createAppStateInitializer(initial?: Partial<AppState>) {
	return {
		colors: [],
		selectors: [
			{ id: 'green', color: 'oklch(79.2% 0.209 151.711)', selected: true },
			{ id: 'red', color: 'oklch(64.5% 0.246 16.439)', selected: false },
			{ id: 'blue', color: 'oklch(71.5% 0.143 215.221)', selected: false }
		],
		drawSelectionValue: 'separate',
		sampleRate: 4,
		filteredColors: [],
		newFilterColor: '',
		savedPalettes: [],
		activeSelectorId: 'green',
		loadingSavedPalettes: false,
		fileInput: null,
		luminosity: 1,
		nearest: 30,
		power: 4,
		maxDistance: 0,
		imageLoaded: false,
		isDragging: false,
		isExtracting: false,
		canvas: null,
		canvasContext: null,
		image: null,
		originalImageWidth: 0,
		originalImageHeight: 0,
		canvasScaleX: 1,
		canvasScaleY: 1,
		startX: 0,
		startY: 0,
		dragScaleX: 1,
		dragScaleY: 1,
		dragRect: null,
		...initial
	} satisfies AppState;
}
