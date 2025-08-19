<script lang="ts">
	// === Imports ===
	import { type Color, type PaletteResponse, type Selector } from '$lib/types/palette';
	import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
	import { tick } from 'svelte';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fly, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	// === State ===
	let selectors: Selector[] = $state([
		{ id: 'green', color: 'oklch(79.2% 0.209 151.711)', selected: true },
		{ id: 'red', color: 'oklch(64.5% 0.246 16.439)', selected: false },
		{ id: 'blue', color: 'oklch(71.5% 0.143 215.221)', selected: false }
	]);

	let activeSelectorId: string | null = $state('green');
	let colors: Color[] = $state([]);
	let drawSelectionValue = $state('separate');
	let imageLoaded = $state(false);
	let isDragging = $state(false);
	let isExtracting = $state(false);
	let sampleRate = $state(4);
	let filteredColors: string[] = $state([]);
	let newFilterColor: string = $state('#fff');

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let image: HTMLImageElement;
	let fileInput = $state<HTMLInputElement>();
	let originalImageWidth = 0;
	let originalImageHeight = 0;
	let canvasScaleX = 1;
	let canvasScaleY = 1;
	let startX = 0,
		startY = 0;
	let dragRect: DOMRect | null = null;
	let dragScaleX = 1,
		dragScaleY = 1;

	// === Saved Palettes ===
	let savedPalettes: { fileName: string; palette: Color[] }[] = $state([]);
	let loadingSavedPalettes = $state(false);

	onMount(async () => {
		const savedPalettesKey = 'savedPalettes';
		let fileNames: string[] = [];

		try {
			const stored = localStorage.getItem(savedPalettesKey);
			if (stored) fileNames = JSON.parse(stored);
		} catch {
			fileNames = [];
		}

		if (fileNames.length === 0) {
			savedPalettes = [];
			return;
		}

		loadingSavedPalettes = true;
		const results: { fileName: string; palette: Color[] }[] = [];

		await Promise.all(
			fileNames.map(async (fileName) => {
				try {
					const res = await fetch(`http://localhost:8080/get-palette?fileName=${encodeURIComponent(fileName)}`);
					if (res.ok) {
						const data = await res.json();
						if (Array.isArray(data.palette)) {
							results.push({ fileName, palette: data.palette });
						}
					}
				} catch {}
			})
		);

		savedPalettes = results;
		loadingSavedPalettes = false;
	});

	// === File Upload & Drop ===
	async function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;
		await drawToCanvas(file);
		await uploadAndExtractPalette([...input.files!]);
	}

	function triggerFileSelect() {
		fileInput?.click();
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files?.length) {
			await drawToCanvas(files[0]);
			await uploadAndExtractPalette([files[0]]);
		}
	}

	function preventDefault(e: Event) {
		e.preventDefault();
	}

	// === Canvas Drawing ===
	async function drawToCanvas(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			image = new Image();
			image.onload = () => {
				ctx = canvas.getContext('2d')!;
				originalImageWidth = image.width;
				originalImageHeight = image.height;

				const maxWidth = 800,
					maxHeight = 400;
				let { width: imgWidth, height: imgHeight } = image;
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

				canvasScaleX = originalImageWidth / imgWidth;
				canvasScaleY = originalImageHeight / imgHeight;
				canvas.width = imgWidth;
				canvas.height = imgHeight;
				canvas.style.width = imgWidth + 'px';
				canvas.style.height = imgHeight + 'px';

				ctx.drawImage(image, 0, 0, imgWidth, imgHeight);
				imageLoaded = true;
				drawImageAndBoxes();
			};
			image.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	}

	function drawImageAndBoxes() {
		if (!ctx || !image) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		selectors.forEach((selector) => {
			if (!selector.selection) return;
			const { x, y, w, h } = selector.selection;

			const clampedX = Math.max(0, Math.min(x, canvas.width - 1));
			const clampedY = Math.max(0, Math.min(y, canvas.height - 1));
			const clampedW = Math.min(w, canvas.width - clampedX);
			const clampedH = Math.min(h, canvas.height - clampedY);

			if (clampedW <= 0 || clampedH <= 0) return;

			ctx.save();
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
			ctx.lineWidth = 4;
			ctx.strokeRect(clampedX - 2, clampedY - 2, clampedW + 4, clampedH + 4);

			ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
			ctx.lineWidth = 2;
			ctx.strokeRect(clampedX - 1, clampedY - 1, clampedW + 2, clampedH + 2);

			ctx.strokeStyle = selector.color;
			ctx.lineWidth = 3;
			ctx.strokeRect(clampedX, clampedY, clampedW, clampedH);

			if (selector.selected) {
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
				ctx.lineWidth = 1;
				ctx.setLineDash([5, 5]);
				ctx.lineDashOffset = -(Date.now() / 150) % 10;
				ctx.strokeRect(clampedX + 2, clampedY + 2, clampedW - 4, clampedH - 4);
			}
			ctx.restore();
		});
	}

	function getMousePos(e: MouseEvent) {
		const rect = dragRect ?? canvas.getBoundingClientRect();
		const scaleX = dragRect ? dragScaleX : canvas.width / rect.width;
		const scaleY = dragRect ? dragScaleY : canvas.height / rect.height;
		return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
	}

	function handleMouseDown(e: MouseEvent) {
		if (isExtracting || !activeSelectorId) return;
		isDragging = true;
		dragRect = canvas.getBoundingClientRect();
		dragScaleX = canvas.width / dragRect.width;
		dragScaleY = canvas.height / dragRect.height;
		const pos = getMousePos(e);
		startX = pos.x;
		startY = pos.y;
	}

	function handleMouseMove(e: MouseEvent) {
		if (isExtracting) {
			isDragging = false;
			dragRect = null;
			return;
		}
		if (!isDragging || !activeSelectorId) return;
		const pos = getMousePos(e);
		const idx = selectors.findIndex((s) => s.id === activeSelectorId);
		if (idx !== -1) {
			selectors[idx] = {
				...selectors[idx],
				selection: {
					x: Math.min(startX, pos.x),
					y: Math.min(startY, pos.y),
					w: Math.abs(pos.x - startX),
					h: Math.abs(pos.y - startY)
				}
			};
		}
		drawImageAndBoxes();
	}

	function handleMouseUp() {
		isDragging = false;
		dragRect = null;
		if (!isExtracting) extractPaletteFromSelection(selectors);
	}

	// === Palette Extraction ===
	async function extractPaletteFromSelection(selectors: Selector[]) {
		isExtracting = true;
		const toastId = toast.loading('Extracting palette...');
		await tick();

		if (!ctx || !canvas || !image) {
			toast.error('No canvas/image context', { id: toastId });
			isExtracting = false;
			return;
		}

		if (canvasScaleX === 0 || canvasScaleY === 0) {
			toast.error('Image scaling not properly initialized', { id: toastId });
			isExtracting = false;
			return;
		}

		const files: Blob[] = [];

		if (drawSelectionValue === 'merge') {
			const validSelections = selectors.filter((s) => s.selection);

			if (validSelections.length === 0) {
				toast.error('No valid selections to extract colors from', { id: toastId });
				isExtracting = false;
				return;
			}

			const totalHeight = validSelections.reduce((sum, s) => sum + Math.round(s.selection!.h * canvasScaleY), 0);
			const maxWidth = Math.max(...validSelections.map((s) => Math.round(s.selection!.w * canvasScaleX)));

			let mergedCanvas: HTMLCanvasElement | OffscreenCanvas;
			if (typeof OffscreenCanvas !== 'undefined') {
				mergedCanvas = new OffscreenCanvas(maxWidth, totalHeight);
			} else {
				const c = document.createElement('canvas');

				c.width = maxWidth;
				c.height = totalHeight;
				mergedCanvas = c;
			}

			const mergedCtx = mergedCanvas.getContext('2d');
			if (!mergedCtx) return;

			let currentY = 0;
			for (const s of validSelections) {
				const scaledX = Math.round(s.selection!.x * canvasScaleX);
				const scaledY = Math.round(s.selection!.y * canvasScaleY);
				const scaledW = Math.round(s.selection!.w * canvasScaleX);
				const scaledH = Math.round(s.selection!.h * canvasScaleY);

				if (
					scaledX >= 0 &&
					scaledY >= 0 &&
					scaledW > 0 &&
					scaledH > 0 &&
					scaledX + scaledW <= originalImageWidth &&
					scaledY + scaledH <= originalImageHeight
				) {
					mergedCtx.drawImage(image, scaledX, scaledY, scaledW, scaledH, 0, currentY, scaledW, scaledH);
				}
				currentY += scaledH;
			}

			const blob = await createBlobFromCanvas(mergedCanvas);
			files.push(blob);
		} else {
			for (const s of selectors) {
				if (!s.selection) continue;

				const scaledX = Math.round(s.selection.x * canvasScaleX);
				const scaledY = Math.round(s.selection.y * canvasScaleY);
				const scaledW = Math.round(s.selection.w * canvasScaleX);
				const scaledH = Math.round(s.selection.h * canvasScaleY);

				let cropCanvas: HTMLCanvasElement | OffscreenCanvas;
				if (typeof OffscreenCanvas !== 'undefined') {
					cropCanvas = new OffscreenCanvas(scaledW, scaledH);
				} else {
					const c = document.createElement('canvas');

					c.width = scaledW;
					c.height = scaledH;
					cropCanvas = c;
				}
				const cropCtx = cropCanvas.getContext('2d');
				if (!cropCtx) continue;

				if (
					scaledX >= 0 &&
					scaledY >= 0 &&
					scaledW > 0 &&
					scaledH > 0 &&
					scaledX + scaledW <= originalImageWidth &&
					scaledY + scaledH <= originalImageHeight
				) {
					cropCtx.drawImage(image, scaledX, scaledY, scaledW, scaledH, 0, 0, scaledW, scaledH);
					const blob = await createBlobFromCanvas(cropCanvas);
					files.push(blob);
				}
			}
		}

		if (files.length > 0) {
			await uploadAndExtractPalette(files, toastId);
		} else {
			toast.error('No valid selections to extract colors from', { id: toastId });
			isExtracting = false;
		}
	}

	function createBlobFromCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
		if ('convertToBlob' in canvas) {
			return (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
		}
		return new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), 'image/png'));
	}

	async function uploadAndExtractPalette(files: Blob[], existingToastId?: string) {
		const formData = new FormData();
		if (files.length === 0) {
			toast.error('No files found');
			return;
		}
		isDragging = false;
		isExtracting = true;
		const toastId = existingToastId ?? toast.loading('Extracting palette...');

		for (const file of files) formData.append('files', file);
		formData.append('sampleRate', sampleRate.toString());
		formData.append('filteredColors', JSON.stringify(filteredColors));

		try {
			const res = await fetch('http://localhost:8080/extract-palette', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) {
				toast.error('Error extracting palette', { id: toastId });
				return;
			}
			const result: PaletteResponse = await res.json();
			if (result.data.length > 0) {
				const extractedColors = result.data.flatMap((p) => p.palette || []);
				if (extractedColors.length > 0) {
					colors = extractedColors;
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
			isExtracting = false;
		}
	}

	// === Clipboard and Formats ===
	async function handleCopy(hex: string) {
		navigator.clipboard.writeText(hex).then(() => toast.success('Copied to clipboard'));
	}

	// === State Reset ===
	async function returnToUpload() {
		await tick();
		imageLoaded = false;
		if (fileInput) {
			fileInput.value = '';
		}
		colors = [];
		activeSelectorId = 'green';
		selectors.forEach((s) => {
			s.selection = undefined;
			s.selected = s.id === 'green';
		});
	}

	// === Save Palette Request ===
	async function savePaletteToFile() {
		if (!colors || colors.length === 0) {
			toast.error('No palette to save!');
			return;
		}
		const fileName = prompt('Enter a file name for your palette (e.g. palette.json):');
		if (!fileName) return;

		try {
			const response = await fetch('http://localhost:8080/save-palette?fileName=' + encodeURIComponent(fileName), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(colors)
			});
			const data = await response.json();

			if (response.ok) {
				toast.success('Palette saved as ' + (data.fileName || fileName));

				const savedPalettesKey = 'savedPalettes';
				let savedPaletteNames: string[] = [];

				try {
					const stored = localStorage.getItem(savedPalettesKey);

					if (stored) {
						savedPaletteNames = JSON.parse(stored);
					}
				} catch (e) {
					savedPaletteNames = [];
				}

				const newFileName = data.fileName || fileName;
				if (!savedPaletteNames.includes(newFileName)) {
					savedPaletteNames.push(newFileName);

					localStorage.setItem(savedPalettesKey, JSON.stringify(savedPaletteNames));
				}

				const exists = savedPalettes.some((p) => p.fileName === newFileName);
				if (exists) {
					savedPalettes = savedPalettes.map((p) =>
						p.fileName === newFileName ? { fileName: newFileName, palette: [...colors] } : p
					);
				} else {
					savedPalettes = [...savedPalettes, { fileName: newFileName, palette: [...colors] }];
				}
			} else {
				toast.error(data.error || 'Failed to save palette.');
			}
		} catch (err) {
			toast.error('Network error.');
		}
	}
</script>

<Toaster />

<div class="relative h-[100svh] bg-black text-white">
	<enhanced:img
		src="../lib/assets/palette.jpg"
		alt="Palette"
		class="absolute top-0 left-0 h-full w-full object-cover"
	/>

	<!-- Dark overlay -->
	<div class="absolute top-0 left-0 z-10 h-full w-full bg-black/60"></div>

	<!-- Content -->
	<div class="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
		<section
			class="absolute inset-0 flex flex-col items-center justify-around transition-opacity duration-300"
			class:opacity-0={imageLoaded}
			class:pointer-events-none={imageLoaded}
			class:opacity-100={!imageLoaded}
			class:pointer-events-auto={!imageLoaded}
		>
			<button
				ondrop={handleDrop}
				ondragover={preventDefault}
				ondragenter={preventDefault}
				ondragleave={preventDefault}
				onclick={triggerFileSelect}
				class="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/10 p-12 text-white transition duration-300 hover:border-white hover:bg-white/20"
			>
				<svg viewBox="0 0 24 24" width="4rem" height="4rem" fill="#fff" class="mb-3 opacity-80 group-hover:opacity-100">
					<path
						d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
					/>
				</svg>
				<span class="text-sm text-white/80 group-hover:text-white">Drop or click to upload</span>
				<input type="file" name="file" bind:this={fileInput} class="hidden" accept="image/*" oninput={onFileChange} />
			</button>
		</section>

		<section class="mb-6 grid grid-cols-4">
			<div></div>
			<div class="col-span-2">
				<canvas
					bind:this={canvas}
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					class="rounded-xl border border-gray-300 shadow-lg transition-opacity duration-300"
					class:opacity-100={imageLoaded}
					class:pointer-events-auto={imageLoaded}
					class:opacity-0={!imageLoaded}
					class:pointer-events-none={!imageLoaded}
				></canvas>
			</div>
		</section>

		{#if imageLoaded}
			<Toolbar
				{colors}
				{selectors}
				{drawSelectionValue}
				{sampleRate}
				{filteredColors}
				{newFilterColor}
				{savedPalettes}
				{loadingSavedPalettes}
				{fileInput}
				onSelectorSelect={(selectorId: string) => {
					activeSelectorId = selectorId;
					selectors = selectors.map((s) =>
						s.id === selectorId ? { ...s, selected: true } : { ...s, selected: false }
					);
				}}
				onDrawOptionChange={(value: string) => {
					drawSelectionValue = value;
				}}
				onSampleRateChange={(rate: number) => {
					sampleRate = rate;
				}}
				onFilterColorAdd={(color: string) => {
					filteredColors = [...filteredColors, color];
				}}
				onFilterColorRemove={(index: number) => {
					filteredColors = filteredColors.filter((_, idx) => idx !== index);
				}}
				onNewFilterColorChange={(value: string) => {
					newFilterColor = value;
				}}
				onPaletteLoad={(palette: Color[]) => {
					colors = palette;
				}}
				{extractPaletteFromSelection}
				{uploadAndExtractPalette}
			/>
		{/if}

		<section class="w-full max-w-5xl">
			<div class="grid min-h-12 grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-5">
				{#each colors as color, i}
					<div
						role="button"
						tabindex="0"
						onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && handleCopy(color.hex)}
						onclick={() => handleCopy(color.hex)}
						in:scale={{ delay: i * 80, duration: 300, start: 0.7 }}
						class="flex h-9 cursor-pointer items-center justify-center rounded-lg p-2 shadow-md"
						style="background-color: {color.hex}"
					>
						<span class="rounded bg-black/50 px-2 py-1 font-mono text-xs">{color.hex}</span>
					</div>
				{/each}
			</div>

			{#if imageLoaded}
				<div transition:fly={{ x: 300, duration: 500 }} class="mt-4 flex flex-row justify-between">
					<button
						class="cursor-pointer rounded border border-[#D09E87] px-4 py-2 text-sm font-bold tracking-tight transition-all hover:-translate-y-2 hover:bg-[#D09E87]"
						onclick={returnToUpload}>Back</button
					>

					<button
						class="ml-4 flex cursor-pointer items-center gap-2 rounded border border-[#D09E87] px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 hover:bg-[#D09E87]"
						onclick={savePaletteToFile}
					>
						Save Palette
						<span> 💾 </span>
					</button>
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
