import type { Color, Selector } from '$lib/types/palette';

export type SavedPaletteItem = {
	fileName: string;
	palette: Color[];
};

export type PaletteState = {
	colors: Color[];
	selectors: Selector[];
	drawSelectionValue: string;
	activeSelectorId: string;
	newFilterColor: string;
	filteredColors: string[];
	savedPalettes: SavedPaletteItem[];
	loadingSavedPalettes: boolean;
};

export function createPaletteStateInitializer(initial?: Partial<PaletteState>): PaletteState {
	return {
		colors: [],
		selectors: [
			{ id: 'green', color: 'oklch(79.2% 0.209 151.711)', selected: true },
			{ id: 'red', color: 'oklch(64.5% 0.246 16.439)', selected: false },
			{ id: 'blue', color: 'oklch(71.5% 0.143 215.221)', selected: false }
		],
		drawSelectionValue: 'separate',
		activeSelectorId: 'green',
		newFilterColor: '',
		filteredColors: [],
		savedPalettes: [],
		loadingSavedPalettes: false,
		...initial
	} satisfies PaletteState;
}
