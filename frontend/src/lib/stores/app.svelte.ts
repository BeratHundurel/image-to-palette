import { browser } from '$app/environment';
import type { Color, Selector } from '$lib/types/palette';
import * as api from '$lib/api/palette';
import toast from 'svelte-french-toast';
import { tick } from 'svelte';

export type SavedPaletteItem = {
	fileName: string;
	palette: Color[];
};

interface AppState {
	// Image & Canvas
	fileInput: HTMLInputElement | null;
	canvas: HTMLCanvasElement | null;
	canvasContext: CanvasRenderingContext2D | null;
	image: HTMLImageElement | null;
	originalImageWidth: number;
	originalImageHeight: number;
	canvasScaleX: number;
	canvasScaleY: number;

	// UI State
	imageLoaded: boolean;
	isDragging: boolean;
	isExtracting: boolean;
	startX: number;
	startY: number;
	dragRect: DOMRect | null;
	dragScaleX: number;
	dragScaleY: number;

	// Palette
	colors: Color[];
	selectors: Selector[];
	drawSelectionValue: string;
	activeSelectorId: string;
	newFilterColor: string;
	filteredColors: string[];
	savedPalettes: SavedPaletteItem[];

	// Extraction Settings
	sampleRate: number;
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
}

function createAppStore() {
	let state = $state<AppState>({
		// Image & Canvas
		fileInput: null,
		canvas: null,
		canvasContext: null,
		image: null,
		originalImageWidth: 0,
		originalImageHeight: 0,
		canvasScaleX: 1,
		canvasScaleY: 1,

		// UI State
		imageLoaded: false,
		isDragging: false,
		isExtracting: false,
		startX: 0,
		startY: 0,
		dragRect: null,
		dragScaleX: 1,
		dragScaleY: 1,

		// Palette
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

		// Extraction Settings
		sampleRate: 4,
		luminosity: 1,
		nearest: 30,
		power: 4,
		maxDistance: 0
	});

	function calculateImageDimensions(originalWidth: number, originalHeight: number, maxWidth = 800, maxHeight = 400) {
		let imgWidth = originalWidth;
		let imgHeight = originalHeight;
		const aspectRatio = imgWidth / imgHeight;

		if (imgWidth > maxWidth || imgHeight > maxHeight) {
			if (aspectRatio > 1) {
				imgWidth = maxWidth;
				imgHeight = maxWidth / aspectRatio;
				if (imgHeight > maxHeight) {
					imgHeight = maxHeight;
					imgWidth = maxHeight * aspectRatio;
				}
			} else {
				imgHeight = maxHeight;
				imgWidth = maxHeight * aspectRatio;
				if (imgWidth > maxWidth) {
					imgWidth = maxWidth;
					imgHeight = maxWidth / aspectRatio;
				}
			}
		}

		return {
			width: imgWidth,
			height: imgHeight,
			scaleX: originalWidth / imgWidth,
			scaleY: originalHeight / imgHeight
		};
	}

	function getMousePos(event: MouseEvent) {
		if (!state.canvas) return { x: 0, y: 0 };

		const rect = state.dragRect ?? state.canvas.getBoundingClientRect();
		const scaleX = state.dragRect ? state.dragScaleX : state.canvas.width / rect.width;
		const scaleY = state.dragRect ? state.dragScaleY : state.canvas.height / rect.height;

		return {
			x: (event.clientX - rect.left) * scaleX,
			y: (event.clientY - rect.top) * scaleY
		};
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

	return {
		get state() {
			return state;
		},

		init() {
			if (!browser) return;

			state.imageLoaded = false;
			state.isDragging = false;
			state.isExtracting = false;
			state.colors = [];

			state.selectors = state.selectors.map((s) => ({
				...s,
				selected: s.id === state.activeSelectorId
			}));
		},

		async drawToCanvas(file: File) {
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
		},

		async drawBlobToCanvas(blob: Blob) {
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
		},

		handleMouseDown(e: MouseEvent) {
			if (!state.canvas || state.isExtracting || !state.activeSelectorId) return;
			state.isDragging = true;
			state.dragRect = state.canvas.getBoundingClientRect();
			state.dragScaleX = state.canvas.width / state.dragRect.width;
			state.dragScaleY = state.canvas.height / state.dragRect.height;
			const pos = getMousePos(e);
			state.startX = pos.x;
			state.startY = pos.y;
		},

		handleMouseMove(e: MouseEvent) {
			if (state.isExtracting) {
				state.isDragging = false;
				state.dragRect = null;
				return;
			}
			if (!state.isDragging || !state.activeSelectorId) return;
			const pos = getMousePos(e);
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
		},

		async handleMouseUp() {
			state.isDragging = false;
			state.dragRect = null;
			if (!state.isExtracting) {
				await appStore.extractPaletteFromSelection();
			}
		},

		async onFileChange(event: Event) {
			const input = event.target as HTMLInputElement;
			const file = input?.files?.[0];
			if (!file) return;

			await appStore.drawToCanvas(file);
			if (input.files && input.files.length > 0) {
				await appStore.extractPalette([...input.files]);
			}
		},

		triggerFileSelect() {
			if (state.fileInput) {
				state.fileInput.value = '';
				state.fileInput.click();
			}
		},

		async handleDrop(event: DragEvent) {
			event.preventDefault();
			const files = event.dataTransfer?.files;
			if (files?.length) {
				await appStore.drawToCanvas(files[0]);
				await appStore.extractPalette([files[0]]);
			}
		},

		async extractPaletteFromSelection() {
			state.isExtracting = true;
			const toastId = toast.loading('Extracting palette...');
			await tick();

			if (!state.canvasContext || !state.canvas || !state.image) {
				toast.error('No canvas/image context', { id: toastId });
				state.isExtracting = false;
				return;
			}

			const files: Blob[] = [];
			const validSelections = state.selectors.filter((s) => s.selection);

			if (validSelections.length === 0) {
				toast.error('No valid selections to extract colors from', { id: toastId });
				state.isExtracting = false;
				return;
			}

			for (const s of validSelections) {
				if (!s.selection) continue;

				const scaledX = Math.round(s.selection.x * state.canvasScaleX);
				const scaledY = Math.round(s.selection.y * state.canvasScaleY);
				const scaledW = Math.round(s.selection.w * state.canvasScaleX);
				const scaledH = Math.round(s.selection.h * state.canvasScaleY);

				const cropCanvas = document.createElement('canvas');
				cropCanvas.width = scaledW;
				cropCanvas.height = scaledH;
				const cropCtx = cropCanvas.getContext('2d');
				if (!cropCtx) continue;

				if (scaledX >= 0 && scaledY >= 0 && scaledW > 0 && scaledH > 0) {
					cropCtx.drawImage(state.image, scaledX, scaledY, scaledW, scaledH, 0, 0, scaledW, scaledH);
					const blob = await new Promise<Blob>((resolve) => cropCanvas.toBlob((b) => resolve(b!), 'image/png'));
					files.push(blob);
				}
			}

			if (files.length > 0) {
				await appStore.extractPalette(files, toastId);
			} else {
				toast.error('No valid selections to extract colors from', { id: toastId });
				state.isExtracting = false;
			}
		},

		async extractPalette(files: (Blob | File)[], existingToastId?: string) {
			if (files.length === 0) {
				toast.error('No files found');
				return;
			}

			state.isExtracting = true;
			const toastId = existingToastId ?? toast.loading('Extracting palette...');

			try {
				const result = await api.extractPalette(files, state.sampleRate, state.filteredColors);
				if (result.data.length > 0) {
					const extractedColors = result.data.flatMap((p) => p.palette || []);

					if (extractedColors.length > 0) {
						state.colors = extractedColors;
						toast.success('Palette extracted', { id: toastId });
					} else {
						toast.error('No colors found in selected regions', { id: toastId });
					}
				} else {
					toast.error('No colors found', { id: toastId });
				}
			} catch (error) {
				toast.error('Error extracting palette: ' + (error instanceof Error ? error.message : 'Unknown error'), {
					id: toastId
				});
			} finally {
				state.isExtracting = false;
			}
		},

		async savePalette() {
			if (!state.colors || state.colors.length === 0) {
				toast.error('No palette to save!');
				return;
			}
			const fileName = prompt('Enter a file name for your palette (e.g. palette.json):');
			if (!fileName) return;

			try {
				const data = await api.savePalette(fileName, state.colors);
				toast.success('Palette saved as ' + (data.fileName || fileName));

				const newFileName = data.fileName || fileName;
				const exists = state.savedPalettes.some((p) => p.fileName === newFileName);

				if (exists) {
					state.savedPalettes = state.savedPalettes.map((p) =>
						p.fileName === newFileName ? { fileName: newFileName, palette: [...state.colors] } : p
					);
				} else {
					state.savedPalettes = [...state.savedPalettes, { fileName: newFileName, palette: [...state.colors] }];
				}

				// Save to localStorage
				if (browser) {
					const fileNames = state.savedPalettes.map((p) => p.fileName);
					localStorage.setItem('savedPalettes', JSON.stringify(fileNames));
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to save palette.');
			}
		},

		async applyPalette() {
			if (!state.imageLoaded) {
				toast.error('Load an image first');
				return;
			}
			if (!state.colors || state.colors.length === 0) {
				toast.error('No palette to apply!');
				return;
			}
			const toastId = toast.loading('Applying palette...');

			try {
				if (!state.canvas) return;

				const srcBlob = await new Promise<Blob>((resolve) => state.canvas!.toBlob((b) => resolve(b!), 'image/png'));

				const outBlob = await api.applyPaletteBlob(srcBlob, state.colors, {
					luminosity: state.luminosity,
					nearest: state.nearest,
					power: state.power,
					maxDistance: state.maxDistance
				});
				await appStore.drawBlobToCanvas(outBlob);

				toast.success('Applied palette', { id: toastId });
			} catch (e) {
				toast.error('Error applying palette', { id: toastId });
			}
		},

		async loadSavedPalettes() {
			if (!browser) return;

			try {
				const stored = localStorage.getItem('savedPalettes');
				const fileNames = stored ? JSON.parse(stored) : [];

				if (fileNames.length === 0) {
					state.savedPalettes = [];
					return;
				}

				const results: SavedPaletteItem[] = [];
				await Promise.all(
					fileNames.map(async (fileName: string) => {
						try {
							const res = await api.getPalette(fileName);
							if (Array.isArray(res.palette)) {
								results.push({ fileName, palette: res.palette });
							}
						} catch {}
					})
				);

				state.savedPalettes = results;
			} catch (error) {
				console.error('Failed to load saved palettes:', error);
			}
		}
	};
}

export const appStore = createAppStore();
