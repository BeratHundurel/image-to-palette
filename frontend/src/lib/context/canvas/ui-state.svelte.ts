export type UIState = {
	imageLoaded: boolean;
	isDragging: boolean;
	isExtracting: boolean;
	startX: number;
	startY: number;
	dragScaleX: number;
	dragScaleY: number;
};

export function createUIStateInitializer(initial?: Partial<UIState>): UIState {
	return {
		imageLoaded: false,
		isDragging: false,
		isExtracting: false,
		startX: 0,
		startY: 0,
		dragScaleX: 1,
		dragScaleY: 1,
		...initial
	} satisfies UIState;
}
