export type CanvasState = {
	fileInput: HTMLInputElement | null | undefined;
	canvas: HTMLCanvasElement | null;
	canvasContext: CanvasRenderingContext2D | null;
	image: HTMLImageElement | null;
	dragRect: DOMRect | null;
	originalImageWidth: number;
	originalImageHeight: number;
	canvasScaleX: number;
	canvasScaleY: number;
};

export function createCanvasStateInitializer(initial?: Partial<CanvasState>): CanvasState {
	return {
		fileInput: null,
		canvas: null,
		canvasContext: null,
		image: null,
		dragRect: null,
		originalImageWidth: 0,
		originalImageHeight: 0,
		canvasScaleX: 1,
		canvasScaleY: 1,
		...initial
	} satisfies CanvasState;
}
