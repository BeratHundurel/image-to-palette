import toast from 'svelte-french-toast';
import { tick } from 'svelte';
import type { Selector } from '$lib/types/palette';
import { createBlobFromCanvas, createCanvas } from '../canvas';
import { addSavedPaletteName } from '.';
import type { AppContext } from '../context.svelte';
import * as api from '$lib/api/palette';

export type PaletteActions = {
	extractPaletteFromSelection: (selectors: Selector[]) => Promise<void>;
	uploadAndExtractPalette: (files: (Blob | File)[]) => Promise<void>;
	savePaletteToFile: () => Promise<void>;
	applyPaletteToImage: () => Promise<void>;
};

export function createPaletteActions(context: AppContext): PaletteActions {
	const state = context.state;
	const actions = context.actions;

	async function extractPaletteFromSelection(selectors: Selector[]) {
		state.isExtracting = true;
		const toastId = toast.loading('Extracting palette...');
		await tick();

		if (!state.canvasContext || !state.canvas || !state.image) {
			toast.error('No canvas/image context', { id: toastId });
			state.isExtracting = false;
			return;
		}

		if (state.canvasScaleX === 0 || state.canvasScaleY === 0) {
			toast.error('Image scaling not properly initialized', { id: toastId });
			state.isExtracting = false;
			return;
		}

		const files: Blob[] = [];

		if (state.drawSelectionValue === 'merge') {
			const validSelections = selectors.filter((s) => s.selection);

			if (validSelections.length === 0) {
				toast.error('No valid selections to extract colors from', { id: toastId });
				state.isExtracting = false;
				return;
			}

			const totalHeight = validSelections.reduce((sum, s) => sum + Math.round(s.selection!.h * state.canvasScaleY), 0);
			const maxWidth = Math.max(...validSelections.map((s) => Math.round(s.selection!.w * state.canvasScaleX)));

			const mergedCanvas = createCanvas(maxWidth, totalHeight);
			const mergedCtx = mergedCanvas.getContext('2d');
			if (!mergedCtx) return;

			let currentY = 0;
			for (const s of validSelections) {
				const scaledX = Math.round(s.selection!.x * state.canvasScaleX);
				const scaledY = Math.round(s.selection!.y * state.canvasScaleY);
				const scaledW = Math.round(s.selection!.w * state.canvasScaleX);
				const scaledH = Math.round(s.selection!.h * state.canvasScaleY);

				if (
					scaledX >= 0 &&
					scaledY >= 0 &&
					scaledW > 0 &&
					scaledH > 0 &&
					scaledX + scaledW <= state.originalImageWidth &&
					scaledY + scaledH <= state.originalImageHeight
				) {
					mergedCtx.drawImage(state.image, scaledX, scaledY, scaledW, scaledH, 0, currentY, scaledW, scaledH);
				}
				currentY += scaledH;
			}

			const blob = await createBlobFromCanvas(mergedCanvas);
			files.push(blob);
		} else {
			for (const s of selectors) {
				if (!s.selection) continue;

				const scaledX = Math.round(s.selection.x * state.canvasScaleX);
				const scaledY = Math.round(s.selection.y * state.canvasScaleY);
				const scaledW = Math.round(s.selection.w * state.canvasScaleX);
				const scaledH = Math.round(s.selection.h * state.canvasScaleY);

				const cropCanvas = createCanvas(scaledW, scaledH);
				const cropCtx = cropCanvas.getContext('2d');
				if (!cropCtx) continue;

				if (
					scaledX >= 0 &&
					scaledY >= 0 &&
					scaledW > 0 &&
					scaledH > 0 &&
					scaledX + scaledW <= state.originalImageWidth &&
					scaledY + scaledH <= state.originalImageHeight
				) {
					cropCtx.drawImage(state.image, scaledX, scaledY, scaledW, scaledH, 0, 0, scaledW, scaledH);
					const blob = await createBlobFromCanvas(cropCanvas);
					files.push(blob);
				}
			}
		}

		if (files.length > 0) {
			await uploadAndExtractPalette(files, toastId);
		} else {
			toast.error('No valid selections to extract colors from', { id: toastId });
			state.isExtracting = false;
		}
	}

	async function uploadAndExtractPalette(files: (Blob | File)[], existingToastId?: string) {
		if (files.length === 0) {
			toast.error('No files found');

			return;
		}

		state.isDragging = false;

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
	}

	// === Save Palette Request ===
	async function savePaletteToFile() {
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

			addSavedPaletteName(newFileName);

			const exists = state.savedPalettes.some((p) => p.fileName === newFileName);

			if (exists) {
				state.savedPalettes = state.savedPalettes.map((p) =>
					p.fileName === newFileName ? { fileName: newFileName, palette: [...state.colors] } : p
				);
			} else {
				state.savedPalettes = [...state.savedPalettes, { fileName: newFileName, palette: [...state.colors] }];
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save palette.');
		}
	}

	// === Apply Palette ===
	async function applyPaletteToImage() {
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

			const srcBlob = await createBlobFromCanvas(state.canvas);

			const outBlob = await api.applyPaletteBlob(srcBlob, state.colors, {
				luminosity: state.luminosity,
				nearest: state.nearest,
				power: state.power,
				maxDistance: state.maxDistance
			});
			await actions.canvas.drawBlobToCanvas(outBlob);

			toast.success('Applied palette', { id: toastId });
		} catch (e) {
			toast.error('Error applying palette', { id: toastId });
		}
	}

	return {
		extractPaletteFromSelection,
		uploadAndExtractPalette,
		savePaletteToFile,
		applyPaletteToImage
	};
}
