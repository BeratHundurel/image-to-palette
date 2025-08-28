import type { Color, Selector } from '$lib/types/palette';
import { getContext, hasContext, setContext } from 'svelte';

export type SavedPaletteItem = {
	fileName: string;
	palette: Color[];
};

export type ToolbarState = {
	colors: Color[];
	selectors: Selector[];
	drawSelectionValue: string;
	sampleRate: number;
	filteredColors: string[];
	newFilterColor: string;
	savedPalettes: SavedPaletteItem[];
	loadingSavedPalettes: boolean;
	fileInput: HTMLInputElement | null | undefined;
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export type ToolbarActions = {
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

export type ToolbarContext = {
	state: ToolbarState;
	actions: ToolbarActions;
};

export const toolbarContextKey = Symbol('toolbar-context');

export function setToolbarContext(ctx: ToolbarContext) {
	setContext(toolbarContextKey, ctx);
}

export function getToolbarContext(): ToolbarContext {
	return getContext(toolbarContextKey) as ToolbarContext;
}

export function hasToolbar(): boolean {
	return hasContext(toolbarContextKey);
}
