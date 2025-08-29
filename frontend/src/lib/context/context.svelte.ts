import type { Color, Selector } from '$lib/types/palette';
import { getContext, hasContext, setContext } from 'svelte';

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
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export type AppActions = {
	onSelectorSelect: (id: string) => void;
	onDrawOptionChange: (value: string) => void;
	onSampleRateChange: (value: number) => void;
	onFilterColorAdd: (hex: string) => void;
	onFilterColorRemove: (index: number) => void;
	onNewFilterColorChange: (value: string) => void;
	onPaletteLoad: (palette: Color[]) => void;
	onLuminosityChange: (value: number) => void;
	onNearestChange: (value: number) => void;
	onPowerChange: (value: number) => void;
	onMaxDistanceChange: (value: number) => void;
	extractPaletteFromSelection: (selectors: Selector[]) => Promise<void>;
	uploadAndExtractPalette: (files: File[]) => Promise<void>;
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

export function createAppActions(
	state: AppState,
	applyPaletteToImage: () => void,
	extractPaletteFromSelection: (selectors: Selector[]) => Promise<void>,
	uploadAndExtractPalette: (files: File[]) => Promise<void>
): AppActions {
	return {
		onSelectorSelect: (id) => {
			state.activeSelectorId = id;
			state.selectors = state.selectors.map((s) => ({
				...s,
				selected: s.id === id
			}));
		},
		onDrawOptionChange: (value) => (state.drawSelectionValue = value),
		onSampleRateChange: (rate) => (state.sampleRate = rate),
		onFilterColorAdd: (hex) => (state.filteredColors = [...state.filteredColors, hex]),
		onFilterColorRemove: (index) => (state.filteredColors = state.filteredColors.filter((_, i) => i !== index)),
		onNewFilterColorChange: (val) => (state.newFilterColor = val),
		onPaletteLoad: (palette) => {
			state.colors = palette;
			applyPaletteToImage();
		},
		onLuminosityChange: (val) => (state.luminosity = val),
		onNearestChange: (val) => (state.nearest = val),
		onPowerChange: (val) => (state.power = val),
		onMaxDistanceChange: (val) => (state.maxDistance = val),
		extractPaletteFromSelection,
		uploadAndExtractPalette
	};
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
		...initial
	} satisfies AppState;
}
