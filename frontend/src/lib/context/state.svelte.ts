import type { PaletteState, SavedPaletteItem } from './palette';
import { createPaletteStateInitializer } from './palette';
import type { CanvasState, ExtractionState, UIState } from './canvas';
import { createCanvasStateInitializer, createExtractionStateInitializer, createUIStateInitializer } from './canvas';

export type AppState = PaletteState & CanvasState & ExtractionState & UIState;

export type { PaletteState, CanvasState, ExtractionState, UIState, SavedPaletteItem };

export function createAppStateInitializer(initial?: Partial<AppState>): AppState {
	// Split initial values by state category if provided
	const paletteInitial: Partial<PaletteState> = initial
		? {
				colors: initial.colors,
				selectors: initial.selectors,
				drawSelectionValue: initial.drawSelectionValue,
				activeSelectorId: initial.activeSelectorId,
				newFilterColor: initial.newFilterColor,
				filteredColors: initial.filteredColors,
				savedPalettes: initial.savedPalettes,
				loadingSavedPalettes: initial.loadingSavedPalettes
			}
		: {};

	const canvasInitial: Partial<CanvasState> = initial
		? {
				fileInput: initial.fileInput,
				canvas: initial.canvas,
				canvasContext: initial.canvasContext,
				image: initial.image,
				dragRect: initial.dragRect,
				originalImageWidth: initial.originalImageWidth,
				originalImageHeight: initial.originalImageHeight,
				canvasScaleX: initial.canvasScaleX,
				canvasScaleY: initial.canvasScaleY
			}
		: {};

	const extractionInitial: Partial<ExtractionState> = initial
		? {
				sampleRate: initial.sampleRate,
				luminosity: initial.luminosity,
				nearest: initial.nearest,
				power: initial.power,
				maxDistance: initial.maxDistance
			}
		: {};

	const uiInitial: Partial<UIState> = initial
		? {
				imageLoaded: initial.imageLoaded,
				isDragging: initial.isDragging,
				isExtracting: initial.isExtracting,
				startX: initial.startX,
				startY: initial.startY,
				dragScaleX: initial.dragScaleX,
				dragScaleY: initial.dragScaleY
			}
		: {};

	// Combine all state initializers
	return {
		...createPaletteStateInitializer(paletteInitial),
		...createCanvasStateInitializer(canvasInitial),
		...createExtractionStateInitializer(extractionInitial),
		...createUIStateInitializer(uiInitial)
	} satisfies AppState;
}

// Helper functions to extract specific state slices
export function extractPaletteState(state: AppState): PaletteState {
	return {
		colors: state.colors,
		selectors: state.selectors,
		drawSelectionValue: state.drawSelectionValue,
		activeSelectorId: state.activeSelectorId,
		newFilterColor: state.newFilterColor,
		filteredColors: state.filteredColors,
		savedPalettes: state.savedPalettes,
		loadingSavedPalettes: state.loadingSavedPalettes
	};
}

export function extractCanvasState(state: AppState): CanvasState {
	return {
		fileInput: state.fileInput,
		canvas: state.canvas,
		canvasContext: state.canvasContext,
		image: state.image,
		dragRect: state.dragRect,
		originalImageWidth: state.originalImageWidth,
		originalImageHeight: state.originalImageHeight,
		canvasScaleX: state.canvasScaleX,
		canvasScaleY: state.canvasScaleY
	};
}

export function extractExtractionState(state: AppState): ExtractionState {
	return {
		sampleRate: state.sampleRate,
		luminosity: state.luminosity,
		nearest: state.nearest,
		power: state.power,
		maxDistance: state.maxDistance
	};
}

export function extractUIState(state: AppState): UIState {
	return {
		imageLoaded: state.imageLoaded,
		isDragging: state.isDragging,
		isExtracting: state.isExtracting,
		startX: state.startX,
		startY: state.startY,
		dragScaleX: state.dragScaleX,
		dragScaleY: state.dragScaleY
	};
}
