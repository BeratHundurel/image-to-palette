import { getMousePos, calculateImageDimensions } from '.';
import type { AppContext } from '../context.svelte';

export type CanvasActions = {
	drawToCanvas: (file: File) => Promise<void>;
	drawBlobToCanvas: (blob: Blob) => Promise<void>;
	handleMouseDown: (e: MouseEvent) => void;
	handleMouseMove: (e: MouseEvent) => void;
	handleMouseUp: () => void;
};

export function createCanvasActions(context: AppContext): CanvasActions {
	const state = context.state;
	const actions = context.actions;

	async function drawToCanvas(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			state.image = new Image();
			state.image.onload = () => {
				if (!state.canvas || !state.image) return;

				state.canvasContext = state.canvas.getContext('2d')!;
				state.originalImageWidth = state.image.width;
				state.originalImageHeight = state.image.height;

				const dimensions = calculateImageDimensions(state.originalImageWidth, state.originalImageHeight);

				state.canvasScaleX = dimensions.scaleX;
				state.canvasScaleY = dimensions.scaleY;
				state.canvas.width = dimensions.width;
				state.canvas.height = dimensions.height;
				state.canvas.style.width = dimensions.width + 'px';
				state.canvas.style.height = dimensions.height + 'px';

				state.canvasContext.drawImage(state.image, 0, 0, dimensions.width, dimensions.height);
				state.imageLoaded = true;
				drawImageAndBoxes();
			};
			state.image.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	function drawImageAndBoxes() {
		if (!state.canvasContext || !state.canvas || !state.image) return;

		state.canvasContext.clearRect(0, 0, state.canvas.width, state.canvas.height);
		state.canvasContext.drawImage(state.image, 0, 0, state.canvas.width, state.canvas.height);

		state.selectors.forEach((selector) => {
			if (!selector.selection || !state.canvasContext || !state.canvas) return;

			const { x, y, w, h } = selector.selection;
			const clampedX = Math.max(0, Math.min(x, state.canvas.width - 1));
			const clampedY = Math.max(0, Math.min(y, state.canvas.height - 1));
			const clampedW = Math.min(w, state.canvas.width - clampedX);
			const clampedH = Math.min(h, state.canvas.height - clampedY);

			if (clampedW <= 0 || clampedH <= 0) return;

			state.canvasContext.save();
			state.canvasContext.strokeStyle = 'rgba(255, 255, 255, 0.95)';
			state.canvasContext.lineWidth = 4;
			state.canvasContext.strokeRect(clampedX - 2, clampedY - 2, clampedW + 4, clampedH + 4);

			state.canvasContext.strokeStyle = 'rgba(0, 0, 0, 0.8)';
			state.canvasContext.lineWidth = 2;
			state.canvasContext.strokeRect(clampedX - 1, clampedY - 1, clampedW + 2, clampedH + 2);

			state.canvasContext.strokeStyle = selector.color;
			state.canvasContext.lineWidth = 3;
			state.canvasContext.strokeRect(clampedX, clampedY, clampedW, clampedH);

			if (selector.selected) {
				state.canvasContext.strokeStyle = 'rgba(255, 255, 255, 0.9)';
				state.canvasContext.lineWidth = 1;
				state.canvasContext.setLineDash([5, 5]);
				state.canvasContext.lineDashOffset = -(Date.now() / 150) % 10;
				state.canvasContext.strokeRect(clampedX + 2, clampedY + 2, clampedW - 4, clampedH - 4);
			}
			state.canvasContext.restore();
		});
	}

	function getMousePosition(e: MouseEvent) {
		return getMousePos(e, state.canvas, state.dragRect, state.dragScaleX, state.dragScaleY);
	}

	function handleMouseDown(e: MouseEvent) {
		if (!state.canvas || state.isExtracting || !state.activeSelectorId) return;
		state.isDragging = true;
		state.dragRect = state.canvas.getBoundingClientRect();
		state.dragScaleX = state.canvas.width / state.dragRect.width;
		state.dragScaleY = state.canvas.height / state.dragRect.height;
		const pos = getMousePosition(e);
		state.startX = pos.x;
		state.startY = pos.y;
	}

	function handleMouseMove(e: MouseEvent) {
		if (state.isExtracting) {
			state.isDragging = false;
			state.dragRect = null;
			return;
		}
		if (!state.isDragging || !state.activeSelectorId) return;
		const pos = getMousePosition(e);
		const idx = state.selectors.findIndex((s) => s.id === state.activeSelectorId);
		if (idx !== -1) {
			state.selectors[idx] = {
				...state.selectors[idx],
				selection: {
					x: Math.min(state.startX, pos.x),
					y: Math.min(state.startY, pos.y),
					w: Math.abs(pos.x - state.startX),
					h: Math.abs(pos.y - state.startY)
				}
			};
		}
		drawImageAndBoxes();
	}

	async function drawBlobToCanvas(blob: Blob) {
		return new Promise<void>((resolve) => {
			const url = URL.createObjectURL(blob);
			const newImage = new Image();
			newImage.onload = () => {
				state.canvasContext = state.canvas?.getContext('2d')!;
				state.originalImageWidth = newImage.width;
				state.originalImageHeight = newImage.height;

				const dimensions = calculateImageDimensions(state.originalImageWidth, state.originalImageHeight);

				if (!state.canvas || !state.canvasContext) return;

				state.canvasScaleX = dimensions.scaleX;
				state.canvasScaleY = dimensions.scaleY;
				state.canvas.width = dimensions.width;
				state.canvas.height = dimensions.height;
				state.canvas.style.width = dimensions.width + 'px';
				state.canvas.style.height = dimensions.height + 'px';

				state.canvasContext.drawImage(newImage, 0, 0, dimensions.width, dimensions.height);
				state.image = newImage;
				state.imageLoaded = true;
				drawImageAndBoxes();
				URL.revokeObjectURL(url);
				resolve();
			};
			newImage.src = url;
		});
	}

	function handleMouseUp() {
		state.isDragging = false;
		state.dragRect = null;
		if (!state.isExtracting) actions.palette.extractPaletteFromSelection(state.selectors);
	}

	return {
		drawToCanvas,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		drawBlobToCanvas
	};
}
