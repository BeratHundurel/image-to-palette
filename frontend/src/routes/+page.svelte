<script lang="ts">
	// === Imports ===
	import { cn } from '$lib/utils';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import { type Color, type NamedColor, type PaletteResponse } from '$lib/types/palette';
	import { tick } from 'svelte';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fly, scale } from 'svelte/transition';

	// === Types ===
	type Selector = {
		id: string;
		color: string;
		selected: boolean;
		selection?: { x: number; y: number; w: number; h: number };
	};

	// === Constants ===
	const copy_options = [
		{ label: 'JSON', value: 'json' },
		{ label: 'CSS Variables', value: 'css_variables' },
		{ label: 'Tailwind Config', value: 'tailwind_config' }
	];

	const draw_options = [
		{ label: 'Get palettes separate for selections', value: 'separate' },
		{ label: 'Merge the selections for unified palette', value: 'merge' }
	];

	// === Reactive State ===
	let selectors: Selector[] = $state([
		{ id: 'green', color: 'oklch(79.2% 0.209 151.711)', selected: true },
		{ id: 'red', color: 'oklch(64.5% 0.246 16.439)', selected: false },
		{ id: 'blue', color: 'oklch(71.5% 0.143 215.221)', selected: false }
	]);

	let activeSelectorId: string | null = $state('green');
	let colors: Color[] = $state([]);
	let copyClipboardValue = $state('json');
	let drawSelectionValue = $state('separate');
	let imageLoaded = $state(false);
	let isDragging = $state(false);
	let showTooltip = $state(false);
	let sampleRate = $state(4);
	let filteredColors: string[] = $state([]);
	let newFilterColor: string = $state('#fff');

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let image: HTMLImageElement;
	let fileInput: HTMLInputElement;

	let startX = 0,
		startY = 0;

	// === Saved Palettes Drawer State ===
	import { onMount } from 'svelte';
	let savedPalettes: { fileName: string; palette: Color[] }[] = $state([]);
	let loadingSavedPalettes = $state(false);

	onMount(async () => {
		const savedPalettesKey = 'savedPalettes';
		let fileNames: string[] = [];
		try {
			const stored = localStorage.getItem(savedPalettesKey);
			if (stored) {
				fileNames = JSON.parse(stored);
			}
		} catch (e) {
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
					const res = await fetch(
						`http://localhost:8080/get-palette?fileName=${encodeURIComponent(fileName)}`
					);
					if (res.ok) {
						const data = await res.json();
						if (data.palette && Array.isArray(data.palette)) {
							results.push({ fileName, palette: data.palette });
						}
					}
				} catch (e) {
					// Ignore fetch errors for now
				}
			})
		);
		savedPalettes = results;
		loadingSavedPalettes = false;
	});

	// === File Upload ===
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

	// === Canvas Image Drawing ===
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

	// === Mouse Events ===
	function getMousePos(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

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
		selectors = selectors.map((s) =>
			s.id === activeSelectorId
				? {
						...s,
						selection: {
							x: Math.min(startX, pos.x),
							y: Math.min(startY, pos.y),
							w: Math.abs(pos.x - startX),
							h: Math.abs(pos.y - startY)
						}
					}
				: s
		);
		drawImageAndBoxes();
	}

	function handleMouseUp() {
		isDragging = false;
		extractPaletteFromSelection(selectors);
	}

	// === Palette Extraction ===
	async function extractPaletteFromSelection(selectors: Selector[]) {
		if (!ctx || !canvas || !image) return;
		const files: Blob[] = [];
		if (drawSelectionValue === 'merge') {
			const validSelections = selectors.filter((s) => s.selection);
			if (validSelections.length === 0) return;

			const totalHeight = validSelections.reduce((sum, s) => sum + s.selection!.h, 0);
			const maxWidth = Math.max(...validSelections.map((s) => s.selection!.w));

			const mergedCanvas = document.createElement('canvas');
			mergedCanvas.width = maxWidth;
			mergedCanvas.height = totalHeight;

			const mergedCtx = mergedCanvas.getContext('2d');
			if (!mergedCtx) return;
			mergedCtx.fillStyle = '#ffffff';
			mergedCtx.fillRect(0, 0, maxWidth, totalHeight);

			let currentY = 0;
			for (const s of validSelections) {
				mergedCtx.drawImage(
					image,
					s.selection!.x,
					s.selection!.y,
					s.selection!.w,
					s.selection!.h,
					0,
					currentY,
					s.selection!.w,
					s.selection!.h
				);
				currentY += s.selection!.h;
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
		if (files.length > 0) await uploadAndExtractPalette(files);
	}

	function createBlobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
		return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
	}

	async function uploadAndExtractPalette(files: Blob[]) {
		const formData = new FormData();
		if (files.length === 0) return toast.error('No files found');
		for (const file of files) formData.append('files', file);
		formData.append('sampleRate', sampleRate.toString());
		formData.append('filteredColors', JSON.stringify(filteredColors));
		try {
			const res = await fetch('http://localhost:8080/extract-palette', {
				method: 'POST',
				body: formData
			});
			if (!res.ok) return toast.error('Error extracting palette');
			const result: PaletteResponse = await res.json();
			if (result.data.length > 0) {
				colors = result.data.flatMap((p) => p.palette);
				toast.success('Palette extracted');
			} else toast.error('No colors found');
		} catch {
			toast.error('Error extracting palette');
		}
	}

	// === Clipboard and Formats ===
	async function handleCopy(hex: string) {
		navigator.clipboard.writeText(hex).then(() => toast.success('Copied to clipboard'));
	}

	function handleCopyFormatChange(format: string) {
		if (colors.length > 0) copyPaletteAs(format, colors);
		else toast.error('No palette to copy');
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
				output = namedPalette.map((c) => `--color-${c.name}: ${c.hex};`).join('\n');
				break;
			case 'tailwind_config':
				output = generateTailwindThemeBlock(namedPalette);
				break;
		}
		navigator.clipboard.writeText(output);
		toast.success(`${format.replace('_', ' ').toUpperCase()} copied to clipboard`);
	}

	async function getNamedPalette(hexValues: string[]): Promise<NamedColor[]> {
		const url = `https://api.color.pizza/v1/?values=${hexValues.map((h) => h.replace('#', '')).join(',')}`;
		const res = await fetch(url);
		if (!res.ok) return [];
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

	// === Draggable Toolbar ===
	let right = $state(100);
	let top = $state(100);
	let moving = $state(false);
	let showPaletteOptions = $state(false);
	let showSavedPopover = $state(false);
	let savedPopoverRef: HTMLDivElement | null = $state(null);
	let openDirection: 'left' | 'right' = $state('right');
	let dragHandle = $state<HTMLElement | undefined>(undefined);

	function onMouseDown(e: MouseEvent) {
		if (dragHandle && dragHandle.contains(e.target as Node)) {
			moving = true;
			e.preventDefault();
		}
	}

	function onMouseMove(e: MouseEvent) {
		if (moving) {
			right -= e.movementX;
			top += e.movementY;
		}
	}

	function onMouseUp() {
		moving = false;
	}

	// === State Reset ===
	async function returnToUpload() {
		await tick();
		imageLoaded = false;
		fileInput.value = '';
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
			const response = await fetch(
				'http://localhost:8080/save-palette?fileName=' + encodeURIComponent(fileName),
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(colors)
				}
			);
			const data = await response.json();
			if (response.ok) {
				toast.success('Palette saved as ' + (data.fileName || fileName));
				// Store saved palette filename in localStorage
				const savedPalettesKey = 'savedPalettes';
				let savedPalettes: string[] = [];
				try {
					const stored = localStorage.getItem(savedPalettesKey);
					if (stored) {
						savedPalettes = JSON.parse(stored);
					}
				} catch (e) {
					savedPalettes = [];
				}
				const newFileName = data.fileName || fileName;
				if (!savedPalettes.includes(newFileName)) {
					savedPalettes.push(newFileName);
					localStorage.setItem(savedPalettesKey, JSON.stringify(savedPalettes));
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

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

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
		class="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden"
	>
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
		</section>

		<section class="mb-6 grid grid-cols-4">
			<div></div>
			<div class="col-span-2">
				<canvas
					bind:this={canvas}
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					class="h-auto max-h-[400px] w-full max-w-3xl rounded-xl shadow-lg transition-opacity duration-300"
					class:opacity-100={imageLoaded}
					class:pointer-events-auto={imageLoaded}
					class:opacity-0={!imageLoaded}
					class:pointer-events-none={!imageLoaded}
				></canvas>
			</div>
		</section>

		{#if imageLoaded}
			<section
				role="toolbar"
				tabindex="0"
				onmousedown={onMouseDown}
				style="right: {right}px; top: {top}px;"
				class="draggable {moving ? 'dragging' : ''}"
				transition:fly={{ y: -300, duration: 500 }}
			>
				<div
					class={cn(
						'rounded-lg border border-zinc-900/50 bg-zinc-900/75 shadow-2xl backdrop-blur-xl',
						'hover:border-zinc-600/50 hover:bg-zinc-900 hover:shadow-[0_0_15px_rgba(238,179,143,0.15)]',
						'transition-all duration-300 ease-out'
					)}
				>
					<div
						bind:this={dragHandle}
						class={cn(
							'flex cursor-move items-center justify-center p-3',
							'border-b border-zinc-700/40',
							'hover:border-[#EEB38F]/20 hover:from-zinc-600/30 hover:to-zinc-700/15',
							'drag-handle transition-all duration-200 ease-out'
						)}
					>
						<div class="flex flex-col items-center gap-1.5">
							<div
								class={cn(
									'grip-line h-0.5 w-8 rounded-full transition-all duration-200 ease-out',
									moving ? 'bg-[#EEB38F]/60 shadow-sm shadow-[#EEB38F]/25' : 'bg-zinc-400/80'
								)}
							></div>
							<div
								class={cn(
									'grip-line h-0.5 w-6 rounded-full transition-all duration-200 ease-out',
									moving ? 'bg-[#EEB38F]/45 shadow-sm shadow-[#EEB38F]/20' : 'bg-zinc-400/60'
								)}
							></div>
						</div>
					</div>
					<div class="p-3">
						<ul class="flex h-80 flex-col gap-3">
							{#each selectors as selector, i}
								<li class="flex">
									<button
										class={cn(
											'flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-white',
											'border border-zinc-700/60 bg-zinc-800/70 backdrop-blur-sm',
											'action-button shadow-lg',
											'focus:ring-1 focus:ring-[#EEB38F]/60 focus:ring-offset-1 focus:ring-offset-zinc-900 focus:outline-none',
											'cubic-bezier(0.4, 0, 0.2, 1) transition-all duration-200'
										)}
										onclick={() => {
											activeSelectorId = selector.id;
											selectors = selectors.map((s) =>
												s.id === selector.id ? { ...s, selected: true } : { ...s, selected: false }
											);
										}}
										aria-label="Selector {i + 1}"
									>
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full border-black"
											style="background-color: {selector.color}"
											class:border-2={selector.selected}
										>
											{#if selector.selected}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													height="16px"
													viewBox="0 -960 960 960"
													width="16px"
													fill="#000"
													><path
														d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
													/></svg
												>
											{/if}
										</div>
									</button>
								</li>
							{/each}

							<li class="relative flex">
								<button
									class={cn(
										'flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-white',
										'border border-zinc-700/60 bg-zinc-800/70 backdrop-blur-sm',
										'action-button shadow-lg',
										'focus:ring-1 focus:ring-[#EEB38F]/60 focus:ring-offset-1 focus:ring-offset-zinc-900 focus:outline-none',
										'cubic-bezier(0.4, 0, 0.2, 1) transition-all duration-200'
									)}
									aria-label="select palette option"
									onclick={(event) => {
										// Toggle palette options dropdown according to available space
										const rect = event.currentTarget.getBoundingClientRect();
										const spaceLeft = rect.left;
										const spaceRight = window.innerWidth - rect.right;

										openDirection = spaceRight >= spaceLeft ? 'right' : 'left';
										showPaletteOptions = !showPaletteOptions;
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="18px"
										viewBox="0 -960 960 960"
										width="18px"
										fill="#fff"
										><path
											d="m403-96-22-114q-23-9-44.5-21T296-259l-110 37-77-133 87-76q-2-12-3-24t-1-25q0-13 1-25t3-24l-87-76 77-133 110 37q19-16 40.5-28t44.5-21l22-114h154l22 114q23 9 44.5 21t40.5 28l110-37 77 133-87 76q2 12 3 24t1 25q0 13-1 25t-3 24l87 76-77 133-110-37q-19 16-40.5 28T579-210L557-96H403Zm59-72h36l19-99q38-7 71-26t57-48l96 32 18-30-76-67q6-17 9.5-35.5T696-480q0-20-3.5-38.5T683-554l76-67-18-30-96 32q-24-29-57-48t-71-26l-19-99h-36l-19 99q-38 7-71 26t-57 48l-96-32-18 30 76 67q-6 17-9.5 35.5T264-480q0 20 3.5 38.5T277-406l-76 67 18 30 96-32q24 29 57 48t71 26l19 99Zm18-168q60 0 102-42t42-102q0-60-42-102t-102-42q-60 0-102 42t-42 102q0 60 42 102t102 42Zm0-144Z"
										/></svg
									>
								</button>

								<!-- Dropdown -->
								{#if showPaletteOptions}
									<div
										class={cn(
											'absolute top-0 z-50 flex min-w-max flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 text-sm text-white shadow-xl backdrop-blur-md',
											openDirection === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
										)}
									>
										<h3 class="mb-1">Palette Options</h3>
										{#each draw_options as option, i}
											<button
												class="w-full rounded-sm p-2 text-left transition hover:bg-zinc-700/60"
												class:bg-zinc-800={drawSelectionValue === option.value}
												onclick={() => {
													let oldValue = drawSelectionValue;
													drawSelectionValue = option.value;
													if (drawSelectionValue != oldValue) {
														extractPaletteFromSelection(selectors);
													}
													showPaletteOptions = false;
												}}
											>
												{option.label}
											</button>

											{#if i < draw_options.length - 1}
												<hr class="border-[#EEB38F]/60" />
											{/if}
										{/each}
										<div class="mt-3 flex items-center justify-between">
											<h3>Sample Options</h3>
											<span
												class="relative"
												onmouseenter={() => (showTooltip = true)}
												onmouseleave={() => (showTooltip = false)}
												role="tooltip"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													height="16px"
													viewBox="0 -960 960 960"
													width="16px"
													fill="#e3e3e3"
													><path
														d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
													/></svg
												>
												{#if showTooltip}
													<span
														class="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded bg-zinc-800 px-3 py-2 text-sm whitespace-normal text-white shadow-lg"
													>
														If sample size is decreased, colors will be more accurate but the
														extraction will take longer.
													</span>
												{/if}
											</span>
										</div>
										<div class="mt-2 flex items-center justify-between">
											<button
												type="button"
												class="rounded p-2 transition hover:bg-zinc-700/60 focus:outline-none"
												onclick={() => (sampleRate = Math.max(sampleRate - 1, 1))}
												aria-label="Decrease sample size"
												tabindex="0"
											>
												<svg
													class="h-3 w-3 text-white/70"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													viewBox="0 0 16 16"
												>
													<line
														x1="4"
														y1="8"
														x2="12"
														y2="8"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
													/>
												</svg>
											</button>
											<input
												id="sample-size"
												type="number"
												class="w-10 bg-transparent text-center text-xs text-white focus:outline-none"
												bind:value={sampleRate}
												min="1"
												max="10"
												step="1"
											/>
											<button
												type="button"
												class="rounded p-2 transition hover:bg-zinc-700/60 focus:outline-none"
												onclick={() => (sampleRate = Math.min(sampleRate + 1, 100))}
												aria-label="Increase sample size"
												tabindex="0"
											>
												<svg
													class="h-3 w-3 text-white/70"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													viewBox="0 0 16 16"
												>
													<line
														x1="8"
														y1="4"
														x2="8"
														y2="12"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
													/>
													<line
														x1="4"
														y1="8"
														x2="12"
														y2="8"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
													/>
												</svg>
											</button>
										</div>
										<div class="my-3 flex items-center gap-3">
											<h3>Color Filters</h3>
											<input
												type="text"
												bind:value={newFilterColor}
												placeholder="#fff"
												class="rounded border border-zinc-700/60 bg-black/30 px-2 py-1 text-xs text-white focus:border-[#EEB38F]/60 focus:outline-none"
												maxlength="7"
												style="width: 80px;"
											/>
											<button
												class="action-button rounded bg-zinc-300 px-2 py-1 text-xs text-black hover:text-white focus:outline-none"
												onclick={() => {
													if (
														/^#[0-9A-Fa-f]{3,6}$/.test(newFilterColor) &&
														!filteredColors.includes(newFilterColor)
													) {
														filteredColors = [...filteredColors, newFilterColor];
														newFilterColor = '';
														let validSelections = selectors.filter((s) => s.selection);
														if (validSelections.length > 0) {
															extractPaletteFromSelection(validSelections);
														} else {
															const files = Array.from(fileInput.files || []);
															uploadAndExtractPalette(files);
														}
													}
												}}
												title="Add filter color">+</button
											>
										</div>
										<ul class="mb-2 flex flex-wrap gap-2">
											{#each filteredColors as color, i}
												<li class="flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-xs">
													<span>{color}</span>
													<button
														class="text-red-400 hover:text-red-600"
														onclick={() => {
															filteredColors = filteredColors.filter((_, idx) => idx !== i);
														}}
														title="Remove">×</button
													>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</li>

							<li>
								<div class="relative" style="display: inline-block;">
									<button
										class="rounded bg-[#D09E87] px-2 py-1 text-xs font-bold text-black shadow transition hover:bg-[#EEB38F]"
										onclick={() => (showSavedPopover = !showSavedPopover)}
										aria-label="Show saved palettes"
										type="button"
									>
										<span>🎨</span>
									</button>
									{#if showSavedPopover}
										<div
											class="absolute top-10 left-0 z-50 w-80 rounded-lg border border-[#D09E87]/40 bg-[#232323] p-3 shadow-2xl"
											style="min-width: 260px;"
										>
											<div class="mb-2 flex items-center justify-between">
												<span class="text-sm font-bold text-[#D09E87]">Saved Palettes</span>
												<button
													class="rounded-full bg-[#D09E87] px-2 py-1 text-xs font-bold text-black transition hover:bg-[#EEB38F]"
													onclick={() => (showSavedPopover = false)}
													aria-label="Close popover"
													type="button"
												>
													&times;
												</button>
											</div>
											<div class="max-h-64 overflow-y-auto">
												{#if loadingSavedPalettes}
													<div class="py-8 text-center text-white/70">Loading...</div>
												{:else if savedPalettes.length === 0}
													<div class="py-8 text-center text-white/70">No saved palettes yet.</div>
												{:else}
													<ul class="flex flex-col gap-3">
														{#each savedPalettes as item}
															<li class="flex flex-col gap-1 rounded bg-[#1a1a1a] p-2 shadow">
																<div class="flex items-center justify-between">
																	<span
																		class="max-w-[120px] truncate font-mono text-xs text-[#D09E87]"
																		title={item.fileName}>{item.fileName}</span
																	>
																	<button
																		class="rounded bg-[#D09E87] px-2 py-1 text-xs font-bold text-black transition hover:bg-[#EEB38F]"
																		onclick={() => {
																			colors = [...item.palette];
																			showSavedPopover = false;
																			toast.success('Palette loaded!');
																		}}
																		type="button"
																	>
																		Load
																	</button>
																</div>
																<div class="mt-1 flex flex-row flex-wrap gap-1">
																	{#each item.palette as color}
																		<span
																			class="inline-block h-5 w-5 rounded border border-white/10 shadow"
																			style="background-color: {color.hex}"
																			title={color.hex}
																		></span>
																	{/each}
																</div>
															</li>
														{/each}
													</ul>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</li>
						</ul>
					</div>
				</div>
			</section>
		{/if}

		<section class="w-full max-w-5xl">
			<div
				class="grid min-h-12 grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-5"
			>
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

					<div class="flex flex-row items-center gap-4">
						<button
							class="ml-4 flex cursor-pointer items-center gap-2 rounded border border-[#D09E87] px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 hover:bg-[#D09E87]"
							onclick={savePaletteToFile}
						>
							Save Palette
							<span> 💾 </span>
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

	/* Firefox */
	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.draggable {
		user-select: none;
		position: absolute;
		z-index: 50;
		transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.draggable.dragging {
		will-change: transform;
		transform: scale(1.02);
	}

	.draggable:not(.dragging) {
		transition:
			left 0.08s cubic-bezier(0.4, 0, 0.2, 1),
			top 0.08s cubic-bezier(0.4, 0, 0.2, 1),
			filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.draggable.dragging * {
		transition: none !important;
		pointer-events: none;
	}

	.drag-handle {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.grip-line {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.action-button {
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.action-button::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(135deg, rgba(238, 179, 143, 0.15), rgba(255, 255, 255, 0.05));
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.action-button:hover {
		background: rgba(39, 39, 42, 0.85);
		border-color: rgba(238, 179, 143, 0.4);
		transform: translateY(-2px) scale(1.05);
		box-shadow:
			0 12px 32px rgba(0, 0, 0, 0.3),
			0 4px 12px rgba(238, 179, 143, 0.1),
			inset 0 1px 0 rgba(238, 179, 143, 0.2);
	}

	.action-button:hover::before {
		opacity: 1;
	}

	.action-button:active {
		transform: translateY(-1px) scale(1.02);
		box-shadow:
			0 6px 20px rgba(0, 0, 0, 0.25),
			0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.drag-handle:hover .grip-line {
		opacity: 1;
		transform: scaleX(1.15);
		filter: drop-shadow(0 0 4px rgba(238, 179, 143, 0.3));
	}

	.dragging .grip-line {
		opacity: 1;
		transform: scaleX(1.05);
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 6px rgba(238, 179, 143, 0.4));
	}

	.action-button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px rgba(238, 179, 143, 0.6),
			0 0 0 4px rgba(0, 0, 0, 0.3),
			0 8px 24px rgba(0, 0, 0, 0.2);
	}
</style>
