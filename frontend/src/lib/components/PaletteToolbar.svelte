<script lang="ts">
	import { cn } from '$lib/utils';
	import { type Color } from '$lib/types/palette';
	import toast from 'svelte-french-toast';
	import { fly } from 'svelte/transition';

	// === Types ===
	type Selector = {
		id: string;
		color: string;
		selected: boolean;
		selection?: { x: number; y: number; w: number; h: number };
	};

	// === Props ===
	let {
		selectors,
		drawSelectionValue,
		sampleRate,
		filteredColors,
		newFilterColor,
		savedPalettes,
		loadingSavedPalettes,
		fileInput,
		onSelectorSelect,
		onDrawOptionChange,
		onSampleRateChange,
		onFilterColorAdd,
		onFilterColorRemove,
		onNewFilterColorChange,
		onPaletteLoad,
		extractPaletteFromSelection,
		uploadAndExtractPalette
	} = $props();

	// === Constants ===
	const draw_options = [
		{ label: 'Get palettes separate for selections', value: 'separate' },
		{ label: 'Merge the selections for unified palette', value: 'merge' }
	];

	const CHECKMARK_PATH =
		'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';

	const SETTINGS_PATH =
		'm403-96-22-114q-23-9-44.5-21T296-259l-110 37-77-133 87-76q-2-12-3-24t-1-25q0-13 1-25t3-24l-87-76 77-133 110 37q19-16 40.5-28t44.5-21l22-114h154l22 114q23 9 44.5 21t40.5 28l110-37 77 133-87 76q2 12 3 24t1 25q0 13-1 25t-3 24l87 76-77 133-110-37q-19 16-40.5 28T579-210L557-96H403Zm59-72h36l19-99q38-7 71-26t57-48l96 32 18-30-76-67q6-17 9.5-35.5T696-480q0-20-3.5-38.5T683-554l76-67-18-30-96 32q-24-29-57-48t-71-26l-19-99h-36l-19 99q-38 7-71 26t-57 48l-96-32-18 30 76 67q-6 17-9.5 35.5T264-480q0 20 3.5 38.5T277-406l-76 67 18 30 96-32q24 29 57 48t71 26l19 99Zm18-168q60 0 102-42t42-102q0-60-42-102t-102-42q-60 0-102 42t-42 102q0 60 42 102t102 42Zm0-144Z';

	const INFO_PATH =
		'M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';

	// === Local State ===
	let showTooltip = $state(false);
	let showPaletteOptions = $state(false);
	let showSavedPopover = $state(false);
	let openDirection: 'left' | 'right' = $state('right');

	// === Drag State ===
	let right = $state(100);
	let top = $state(100);
	let moving = $state(false);
	let dragHandle = $state<HTMLElement | undefined>(undefined);

	// === Functions ===
	function handleMouseDown(e: MouseEvent) {
		if (dragHandle && dragHandle.contains(e.target as Node)) {
			moving = true;
			e.preventDefault();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (moving) {
			right -= e.movementX;
			top += e.movementY;
		}
	}

	function handleMouseUp() {
		moving = false;
	}

	function handleSampleRateChange(delta: number) {
		const newRate = delta > 0 ? Math.min(sampleRate + delta, 100) : Math.max(sampleRate + delta, 1);
		onSampleRateChange(newRate);
	}

	async function handleDrawOptionChange(optionValue: string) {
		let oldValue = drawSelectionValue;
		onDrawOptionChange(optionValue);
		if (optionValue !== oldValue) {
			await extractPaletteFromSelection(selectors);
		}
		showPaletteOptions = false;
	}

	function handlePopoverToggle(type: 'palette' | 'saved', event: MouseEvent) {
		const target = event.currentTarget as HTMLButtonElement;
		if (!target) return;
		const rect = target.getBoundingClientRect();
		const spaceLeft = rect.left;
		const spaceRight = window.innerWidth - rect.right;

		openDirection = spaceRight >= spaceLeft ? 'right' : 'left';

		if (type === 'palette') {
			showPaletteOptions = !showPaletteOptions;
			if (showSavedPopover) showSavedPopover = false;
		} else {
			showSavedPopover = !showSavedPopover;
			if (showPaletteOptions) showPaletteOptions = false;
		}
	}

	async function handleFilterColorAdd() {
		if (/^#[0-9A-Fa-f]{3,6}$/.test(newFilterColor) && !filteredColors.includes(newFilterColor)) {
			onFilterColorAdd(newFilterColor);
			onNewFilterColorChange('');

			let validSelections = selectors.filter((s: Selector) => s.selection);
			if (validSelections.length > 0) {
				await extractPaletteFromSelection(validSelections);
			} else if (fileInput) {
				const files = Array.from(fileInput.files || []);
				await uploadAndExtractPalette(files);
			}
		}
	}

	function handlePaletteLoad(palette: Color[]) {
		onPaletteLoad([...palette]);
		showSavedPopover = false;
		toast.success('Palette loaded!');
	}
</script>

<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMouseMove} />

<section
	role="toolbar"
	tabindex="0"
	onmousedown={handleMouseDown}
	style="right: {right}px; top: {top}px;"
	class="draggable {moving ? 'dragging' : ''}"
	transition:fly={{ y: -300, duration: 500 }}
>
	<div
		class={cn(
			'rounded-lg border border-brand/40 bg-zinc-900 shadow-2xl ',
			'hover:shadow-brand hover:border-zinc-600',
			'transition-all duration-300 ease-out'
		)}
	>
		<div
			bind:this={dragHandle}
			class={cn(
				'flex cursor-move items-center justify-center p-3',
				'hover:border-brand  hover:from-zinc-600 hover:to-zinc-900',
				'drag-handle transition-all duration-200 ease-out'
			)}
		>
			<div class="flex flex-col items-center gap-1.5">
				<div
					class={cn(
						'grip-line h-0.5 w-8 rounded-full transition-all duration-200 ease-out',
						moving ? 'bg-brand/80 shadow-brand' : 'bg-zinc-400/80'
					)}
				></div>
				<div
					class={cn(
						'grip-line h-0.5 w-6 rounded-full transition-all duration-200 ease-out',
						moving ? 'bg-brand/40 shadow-brand' : 'bg-zinc-400/40'
					)}
				></div>
			</div>
		</div>
		<div class="p-3">
			<ul class="flex h-80 flex-col gap-3">
				{#each selectors as selector, i}
					<li class="flex">
						<button
							class="palette-button-base focus:ring-brand"
							onclick={() => onSelectorSelect(selector.id)}
							aria-label="Selector {i + 1}"
						>
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full border-zinc-900"
								style="background-color: {selector.color}"
							>
								{#if selector.selected}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="16px"
										viewBox="0 -960 960 960"
										width="16px"
										fill="#000"><path d={CHECKMARK_PATH} /></svg
									>
								{/if}
							</div>
						</button>
					</li>
				{/each}

				<li class="relative flex">
					<button
						class="palette-button-base focus:ring-brand"
						aria-label="select palette option"
						onclick={(e) => handlePopoverToggle('palette', e)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#fff"
							><path d={SETTINGS_PATH} /></svg
						>
					</button>

					<!-- Dropdown -->
					{#if showPaletteOptions}
						<div
							class={cn(
								'palette-dropdown-base flex min-w-max flex-col gap-2 border-zinc-600',
								openDirection === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
							)}
						>
							<h3 class="mb-1">Palette Options</h3>
							{#each draw_options as option, i}
								<button
									class="w-full rounded-sm p-2 text-left transition hover:bg-zinc-700"
									class:bg-zinc-800={drawSelectionValue === option.value}
									onclick={() => handleDrawOptionChange(option.value)}
								>
									{option.label}
								</button>

								{#if i < draw_options.length - 1}
									<hr class="border-brand" />
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
										fill="#fff"><path d={INFO_PATH} /></svg
									>
									{#if showTooltip}
										<span
											class="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded bg-zinc-800 px-3 py-2 text-sm whitespace-normal text-white shadow-lg"
										>
											If sample size is decreased, colors will be more accurate but the extraction will take longer.
										</span>
									{/if}
								</span>
							</div>
							<div class="mt-2 flex items-center justify-between">
								<button
									type="button"
									class="rounded p-2 transition hover:bg-zinc-700 focus:outline-none"
									onclick={() => handleSampleRateChange(-1)}
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
										<line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
									</svg>
								</button>
								<input
									id="sample-size"
									type="number"
									class="w-10 bg-transparent text-center text-xs text-white focus:outline-none"
									value={sampleRate}
									onchange={(e) => onSampleRateChange(Number(e.currentTarget.value))}
									min="1"
									max="10"
									step="1"
								/>
								<button
									type="button"
									class="rounded p-2 transition hover:bg-zinc-700 focus:outline-none"
									onclick={() => handleSampleRateChange(1)}
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
										<line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
										<line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
									</svg>
								</button>
							</div>
							<div class="my-3 flex items-center gap-3">
								<h3>Color Filters</h3>
								<input
									type="text"
									value={newFilterColor}
									oninput={(e) => onNewFilterColorChange(e.currentTarget.value)}
									placeholder="#fff"
									class="focus:border-brand rounded border border-zinc-700 bg-black/30 px-2 py-1 text-xs text-white focus:outline-none"
									maxlength="7"
									style="width: 80px;"
								/>
								<button
									class="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white transition-colors hover:bg-zinc-700 hover:text-white focus:outline-none"
									onclick={handleFilterColorAdd}
									title="Add filter color">+</button
								>
							</div>
							<ul class="mb-2 flex flex-wrap gap-2">
								{#each filteredColors as color, i}
									<li class="flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-xs">
										<span>{color}</span>
										<button
											class="text-red-400 hover:text-red-600"
											onclick={() => onFilterColorRemove(i)}
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
							class="palette-button-base focus:ring-brand border-zinc-700"
							onclick={(e) => handlePopoverToggle('saved', e)}
							aria-label="Show saved palettes"
							type="button"
						>
							<span>🎨</span>
						</button>
						{#if showSavedPopover}
							<div
								class={cn(
									'palette-dropdown-base border-brand/40 w-80',
									openDirection === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
								)}
								style="min-width: 260px;"
							>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-brand text-sm font-bold">Saved Palettes</span>
									<button
										class="bg-brand rounded-full px-2 py-1 text-xs font-bold text-black"
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
												<li class="flex flex-col gap-1 rounded border border-zinc-700/60 bg-zinc-800/70 p-2">
													<div class="flex items-center justify-between">
														<span class="text-brand max-w-[120px] truncate font-mono text-xs" title={item.fileName}
															>{item.fileName}</span
														>
														<button
															class="bg-brand rounded px-2 py-1 text-xs font-bold text-black"
															onclick={() => handlePaletteLoad(item.palette)}
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

<style>
	.draggable {
		position: fixed;
		z-index: 50;
		user-select: none;
	}

	.draggable.dragging {
		cursor: move;
	}

	.draggable:not(.dragging) {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: auto;
		z-index: 30;
	}

	.draggable.dragging * {
		pointer-events: none;
	}

	.drag-handle {
		cursor: move;
	}

	.grip-line {
		background-color: rgba(161, 161, 170, 0.8);
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

	/* Action Button Effects */
	.palette-button-base::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: translateX(-100%);
		transition: transform 0.6s;
	}

	.palette-button-base:hover {
		border-color: rgba(161, 161, 170, 0.6);
		background-color: rgba(39, 39, 42, 0.9);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	.palette-button-base:hover::before {
		transform: translateX(100%);
	}

	.palette-button-base:active {
		transform: scale(0.95);
		transition: transform 0.1s;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.palette-button-base:focus-visible {
		outline: 2px solid rgba(161, 161, 170, 0.6);
		outline-offset: 2px;
		border-color: rgba(161, 161, 170, 0.8);
	}
</style>
