<script lang="ts">
	import Dropdown from '$lib/components/Dropdown.svelte';
	import { type Color, type NamedColor, type PaletteResponse } from '$lib/types/palette';
	import { tick } from 'svelte';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fly, scale } from 'svelte/transition';

	const copy_options = [
		{ label: 'JSON', value: 'json' },
		{ label: 'CSS Variables', value: 'css_variables' },
		{ label: 'Tailwind Config', value: 'tailwind_config' }
	];

	const draw_options = [
		{ label: 'Get palettes seperate for selections', value: 'seperate' },
		{ label: 'Merge the selections for unified palette', value: 'merge' }
	];

	// === Selector ===
	type Selector = {
		id: string;
		color: string;
		selected: boolean;
		selection?: { x: number; y: number; w: number; h: number };
	};

	let selectors: Selector[] = $state([
		{ id: 'green', color: 'oklch(79.2% 0.209 151.711)', selected: true, selection: undefined },
		{ id: 'red', color: 'oklch(64.5% 0.246 16.439)', selected: false, selection: undefined },
		{ id: 'blue', color: 'oklch(71.5% 0.143 215.221)', selected: false, selection: undefined }
	]);

	let activeSelectorId: string | null = $state('green');

	// === State ===
	let colors: Color[] = $state([]);
	let copyClipboardValue = $state('json');
	let drawSelectionValue = $state('seperate');
	let imageLoaded = $state(false);
	let isDragging = $state(false);
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let image: HTMLImageElement;
	let fileInput: HTMLInputElement;

	let startX = 0,
		startY = 0;

	// === File Handling ===
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
		if (files && files.length > 0) {
			const file = files[0];
			await drawToCanvas(file);
			await uploadAndExtractPalette([file]);
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
				canvas.width = image.width;
				canvas.height = image.height;
				ctx.drawImage(image, 0, 0);
				imageLoaded = true;
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
			if (selector.selection) {
				ctx.strokeStyle = selector.color;
				ctx.lineWidth = 2;
				const { x, y, w, h } = selector.selection;
				ctx.strokeRect(x, y, w, h);
			}
		});
	}

	function getMousePos(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	// === Mouse Events for Selection ===
	function handleMouseDown(e: MouseEvent) {
		if (!activeSelectorId) return;
		isDragging = true;
		const pos = getMousePos(e);
		startX = pos.x;
		startY = pos.y;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !activeSelectorId) return;
		const pos = getMousePos(e);

		selectors = selectors.map((s) => {
			if (s.id === activeSelectorId) {
				return {
					...s,
					selection: {
						x: Math.min(startX, pos.x),
						y: Math.min(startY, pos.y),
						w: Math.abs(pos.x - startX),
						h: Math.abs(pos.y - startY)
					}
				};
			}
			return s;
		});

		drawImageAndBoxes();
	}

	function handleMouseUp() {
		isDragging = false;
		extractPaletteFromSelection(selectors);
	}

	// === Palette Extraction ===
	async function uploadAndExtractPalette(files: Blob[]) {
		const formData = new FormData();

		if (files.length === 0) {
			toast.error('No files found');
			return;
		}

		for (const file of files) {
			formData.append('files', file);
		}

		try {
			const res = await fetch('http://localhost:8080/extract-palette', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				toast.error('Error extracting palette');
				return;
			}

			const result: PaletteResponse = await res.json();

			if (result.data.length > 0) {
				colors = result.data.flatMap((p) => p.palette);
			} else {
				toast.error('No colors found');
			}
			toast.success('Palette extracted');
		} catch {
			toast.error('Error extracting palette');
		}
	}

	function createBlobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
		return new Promise((resolve) => {
			canvas.toBlob((b) => resolve(b!), 'image/png');
		});
	}

	async function extractPaletteFromSelection(selectors: Selector[]) {
		if (!ctx || !canvas || !image) return;

		const files: Blob[] = [];

		if (drawSelectionValue === 'merge') {
			const mergedCanvas = document.createElement('canvas');
			mergedCanvas.width = canvas.width;
			mergedCanvas.height = canvas.height;

			const mergedCtx = mergedCanvas.getContext('2d');
			if (!mergedCtx) return;

			for (const s of selectors) {
				if (!s.selection) continue;
				mergedCtx.drawImage(
					image,
					s.selection.x,
					s.selection.y,
					s.selection.w,
					s.selection.h,
					s.selection.x,
					s.selection.y,
					s.selection.w,
					s.selection.h
				);
			}

			const blob = await createBlobFromCanvas(mergedCanvas);
			files.push(blob);
		} else {
			for (const s of selectors) {
				if (!s.selection) continue;

				const cropCanvas = document.createElement('canvas');
				cropCanvas.width = s.selection.w;
				cropCanvas.height = s.selection.h;

				const cropCtx = cropCanvas.getContext('2d');
				if (!cropCtx) continue;

				cropCtx.drawImage(
					image,
					s.selection.x,
					s.selection.y,
					s.selection.w,
					s.selection.h,
					0,
					0,
					s.selection.w,
					s.selection.h
				);

				const blob = await createBlobFromCanvas(cropCanvas);
				files.push(blob);
			}
		}

		if (files.length > 0) {
			await uploadAndExtractPalette(files);
		}
	}

	async function returnToUpload() {
		await tick();
		imageLoaded = false;
		fileInput.value = '';
		colors = [];

		activeSelectorId = 'green';
		selectors.forEach((selector) => {
			selector.selection = undefined;
			selector.selected = selector.id === 'green';
		});
	}

	// === Clipboard & Format Utilities ===
	async function handleCopy(hex: string) {
		await navigator.clipboard.writeText(hex).then(() => toast.success('Copied to clipboard'));
	}

	function handleCopyFormatChange(format: string) {
		if (colors.length > 0) {
			copyPaletteAs(format, colors);
		} else {
			toast.error('No palette to copy');
		}
	}

	async function copyPaletteAs(format: string, palette: Color[]) {
		let output = '';
		const hexValues = palette.map((c) => c.hex);
		const namedPalette = await getNamedPalette(hexValues);

		switch (format) {
			case 'json':
				output = JSON.stringify(namedPalette, null, 2);
				break;

			case 'css_variables':
				output = namedPalette.map((color) => `--color-${color.name}: ${color.hex};`).join('\n');
				break;

			case 'tailwind_config':
				output = generateTailwindThemeBlock(namedPalette);
				break;
		}

		navigator.clipboard.writeText(output);
		toast.success(`${format.replace('_', ' ').toUpperCase()} copied to clipboard`);
	}

	async function getNamedPalette(hexValues: string[]): Promise<NamedColor[]> {
		const url = `https://api.color.pizza/v1/?values=${hexValues
			.map((h) => h.replace('#', ''))
			.join(',')}`;

		const res = await fetch(url);
		if (!res.ok) {
			toast.error('Failed to fetch color names');
			return [];
		}

		const data = await res.json();
		return data.colors.map((c: NamedColor) => ({
			name: slugifyName(c.name),
			hex: c.hex.toLowerCase()
		}));
	}

	function generateTailwindThemeBlock(colors: NamedColor[]) {
		return `@theme {\n${colors.map((c) => `  --color-${c.name}: ${c.hex};`).join('\n')}\n}`;
	}

	function slugifyName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function handleDrawSelectionChange(value: string) {
		drawSelectionValue = value;
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
	<div
		class="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4"
	>
		<h1
			class="absolute top-[25%] right-0 left-0 text-center text-3xl font-bold tracking-tight drop-shadow-lg transition-transform duration-500 md:text-4xl"
			style="transform: translateY({imageLoaded ? '-325%' : '0'})"
		>
			{imageLoaded ? 'Crop a section of your image' : 'Upload your image to extract palette'}
		</h1>

		<div
			class="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
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
				<svg
					viewBox="0 0 24 24"
					width="4rem"
					height="4rem"
					fill="#fff"
					class="mb-3 opacity-80 group-hover:opacity-100"
				>
					<path
						d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
					/>
				</svg>
				<span class="text-sm text-white/80 group-hover:text-white">Drop or click to upload</span>
				<input
					type="file"
					name="file"
					bind:this={fileInput}
					class="hidden"
					accept="image/*"
					oninput={onFileChange}
				/>
			</button>
		</div>

		<div class="flex flex-row items-start justify-center gap-3">
			<canvas
				bind:this={canvas}
				onmousedown={handleMouseDown}
				onmousemove={handleMouseMove}
				onmouseup={handleMouseUp}
				class="mb-6 h-auto max-h-[400px] w-full max-w-3xl rounded-xl shadow-lg transition-opacity duration-300"
				class:opacity-100={imageLoaded}
				class:pointer-events-auto={imageLoaded}
				class:opacity-0={!imageLoaded}
				class:pointer-events-none={!imageLoaded}
			></canvas>
			{#if imageLoaded}
				<div class="flex flex-row gap-1">
					<div
						transition:fly={{ y: -300, duration: 500 }}
						class="flex flex-col items-start justify-center gap-3"
					>
						{#each selectors as selector}
							<button
								class="flex cursor-pointer flex-col items-center justify-center"
								onclick={() => {
									activeSelectorId = selector.id;
									selectors = selectors.map((s) =>
										s.id === selector.id ? { ...s, selected: true } : { ...s, selected: false }
									);
								}}
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full shadow-md"
									style="background-color: {selector.color}"
								>
									{#if selector.selected}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											height="20px"
											viewBox="0 -960 960 960"
											width="20px"
											fill="#000"
											><path
												d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
											/></svg
										>
									{/if}
								</div>
							</button>
						{/each}
						<Dropdown
							options={draw_options}
							value={drawSelectionValue}
							onChange={handleDrawSelectionChange}
						/>
					</div>
				</div>
			{/if}
		</div>

		<div class="w-full max-w-5xl px-4">
			<div
				class="grid min-h-12 grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-5"
			>
				{#each colors as color, i (color.hex)}
					<div
						role="button"
						tabindex="0"
						onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && handleCopy(color.hex)}
						onclick={() => handleCopy(color.hex)}
						in:scale={{ delay: i * 80, duration: 300, start: 0.7 }}
						class="flex h-10 cursor-pointer items-center justify-center rounded-xl p-3 shadow-md"
						style="background-color: {color.hex}"
					>
						<span class="rounded bg-black/50 px-2 py-1 font-mono text-xs">{color.hex}</span>
					</div>
				{/each}
			</div>
			{#if imageLoaded}
				<div transition:fly={{ x: 300, duration: 500 }} class="mt-4 flex flex-row justify-between">
					<button class="cursor-pointer text-sm font-bold tracking-tight" onclick={returnToUpload}>
						Return to upload
					</button>

					<div class="flex flex-row items-center gap-2 text-sm font-bold tracking-tight">
						<button
							class="bg-mint-500 cursor-pointer"
							onclick={() => copyPaletteAs(copyClipboardValue, colors)}
						>
							Copy as
						</button>
						<Dropdown
							options={copy_options}
							value={copyClipboardValue}
							onChange={handleCopyFormatChange}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
