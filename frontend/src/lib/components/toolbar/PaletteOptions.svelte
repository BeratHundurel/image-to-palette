<script lang="ts">
	import { cn } from '$lib/utils';
	import { popovers, popoverState } from '$lib/stores/popovers';
	import { type Selector } from '$lib/types/palette';
	import { getToolbarContext } from './context';

	const { state: toolbar, actions } = getToolbarContext();

	const draw_options = [
		{ label: 'Get palettes separate for selections', value: 'separate' },
		{ label: 'Merge the selections for unified palette', value: 'merge' }
	];

	let showTooltip = $state(false);

	// Derive local bindings
	let drawSelectionValue = $derived(toolbar.drawSelectionValue);
	let sampleRate = $derived(toolbar.sampleRate);
	let filteredColors = $derived(toolbar.filteredColors);
	let newFilterColor = $derived(toolbar.newFilterColor);

	function handleSampleRateChange(delta: number) {
		const newRate = delta > 0 ? Math.min(toolbar.sampleRate + delta, 10) : Math.max(toolbar.sampleRate + delta, 1);
		actions.onSampleRateChange(newRate);
	}

	async function handleDrawOptionChange(optionValue: string) {
		const oldValue = toolbar.drawSelectionValue;

		actions.onDrawOptionChange(optionValue);
		if (optionValue !== oldValue) {
			await actions.extractPaletteFromSelection(toolbar.selectors);
		}

		popovers.close('palette');
	}

	async function handleFilterColorAdd() {
		if (
			/^#[0-9A-Fa-f]{3,6}$/.test(toolbar.newFilterColor) &&
			!toolbar.filteredColors.includes(toolbar.newFilterColor)
		) {
			actions.onFilterColorAdd(toolbar.newFilterColor);
			actions.onNewFilterColorChange('');

			let validSelections = toolbar.selectors.filter((s: Selector) => s.selection);
			if (validSelections.length > 0) {
				await actions.extractPaletteFromSelection(validSelections);
			} else if (toolbar.fileInput) {
				const files = Array.from(toolbar.fileInput.files || []);

				await actions.uploadAndExtractPalette(files);
			}
		}
	}
</script>

<li class="relative flex">
	<button
		class="palette-button-base"
		aria-label="select palette option"
		onclick={(e) => popovers.toggleFromEvent('palette', e)}
		type="button"
	>
		<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#fff"
			><path
				d="m403-96-22-114q-23-9-44.5-21T296-259l-110 37-77-133 87-76q-2-12-3-24t-1-25q0-13 1-25t3-24l-87-76 77-133 110 37q19-16 40.5-28t44.5-21l22-114h154l22 114q23 9 44.5 21t40.5 28l110-37 77 133-87 76q2 12 3 24t1 25q0 13-1 25t-3 24l87 76-77 133-110-37q-19 16-40.5 28T579-210L557-96H403Zm59-72h36l19-99q38-7 71-26t57-48l96 32 18-30-76-67q6-17 9.5-35.5T696-480q0-20-3.5-38.5T683-554l76-67-18-30-96 32q-24-29-57-48t-71-26l-19-99h-36l-19 99q-38 7-71 26t-57 48l-96-32-18 30 76 67q-6 17-9.5 35.5T264-480q0 20 3.5 38.5T277-406l-76 67 18 30 96-32q24 29 57 48t71 26l19 99Zm18-168q60 0 102-42t42-102q0-60-42-102t-102-42q-60 0-102 42t-42 102q0 60 42 102t102 42Zm0-144Z"
			/></svg
		>
	</button>

	{#if $popoverState.current === 'palette'}
		<div
			class={cn(
				'palette-dropdown-base flex min-w-max flex-col gap-2 border-zinc-600',
				$popoverState.direction === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
			)}
		>
			<h3 class="mb-1">Palette Options</h3>
			{#each draw_options as option, i}
				<button
					class="w-full cursor-pointer rounded-sm p-2 text-left transition hover:bg-zinc-700"
					class:bg-zinc-800={drawSelectionValue === option.value}
					onclick={() => handleDrawOptionChange(option.value)}
					type="button"
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
					<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#fff"
						><path
							d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
						/></svg
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
					class="cursor-pointer rounded p-2 transition hover:bg-zinc-700 focus:outline-none"
					onclick={() => handleSampleRateChange(-1)}
					aria-label="Decrease sample size"
					tabindex="0"
				>
					<svg class="h-3 w-3 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 16 16">
						<line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>
				<input
					id="sample-size"
					type="number"
					class="w-10 bg-transparent text-center text-xs text-white focus:outline-none"
					value={sampleRate}
					onchange={(e) => actions.onSampleRateChange(Number(e.currentTarget.value))}
					min="1"
					max="10"
					step="1"
				/>
				<button
					type="button"
					class="cursor-pointer rounded p-2 transition hover:bg-zinc-700 focus:outline-none"
					onclick={() => handleSampleRateChange(1)}
					aria-label="Increase sample size"
					tabindex="0"
				>
					<svg class="h-3 w-3 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 16 16">
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
					oninput={(e) => actions.onNewFilterColorChange(e.currentTarget.value)}
					placeholder="#fff"
					class="focus:border-brand rounded border border-zinc-700 bg-black/30 px-2 py-1 text-xs text-white focus:outline-none"
					maxlength="7"
					style="width: 80px;"
				/>
				<button
					class="cursor-pointer rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white transition-colors hover:bg-zinc-700 hover:text-white focus:outline-none"
					onclick={handleFilterColorAdd}
					title="Add filter color"
					type="button"
				>
					+
				</button>
			</div>

			<ul class="mb-2 flex flex-wrap gap-2">
				{#each filteredColors as color, i}
					<li class="flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-xs">
						<span>{color}</span>
						<button
							class="text-red-400 hover:text-red-600"
							onclick={() => actions.onFilterColorRemove(i)}
							title="Remove"
							type="button"
						>
							×
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</li>
