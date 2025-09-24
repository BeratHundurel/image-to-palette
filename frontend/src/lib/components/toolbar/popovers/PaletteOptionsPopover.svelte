<script lang="ts">
	import { cn } from '$lib/utils';
	import { type Selector } from '$lib/types/palette';
	import { appStore } from '$lib/stores/app.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	const draw_options = [
		{ label: 'Get palettes separate for selections', value: 'separate' },
		{ label: 'Merge the selections for unified palette', value: 'merge' }
	];

	let showTooltip = $state(false);

	let drawSelectionValue = $derived(appStore.state.drawSelectionValue);
	let sampleRate = $derived(appStore.state.sampleRate);
	let filteredColors = $derived(appStore.state.filteredColors);
	let newFilterColor = $derived(appStore.state.newFilterColor);

	function handleSampleRateChange(delta: number) {
		const newRate =
			delta > 0 ? Math.min(appStore.state.sampleRate + delta, 10) : Math.max(appStore.state.sampleRate + delta, 1);
		appStore.state.sampleRate = newRate;
	}

	async function handleDrawOptionChange(optionValue: string) {
		const oldValue = appStore.state.drawSelectionValue;
		appStore.state.drawSelectionValue = optionValue;
		if (optionValue !== oldValue) {
			await appStore.extractPaletteFromSelection();
		}

		popoverStore.close('palette');
	}

	async function handleFilterColorAdd() {
		if (
			/^#[0-9A-Fa-f]{3,6}$/.test(appStore.state.newFilterColor) &&
			!appStore.state.filteredColors.includes(appStore.state.newFilterColor)
		) {
			appStore.state.filteredColors = [...appStore.state.filteredColors, appStore.state.newFilterColor];
			appStore.state.newFilterColor = '';

			let validSelections = appStore.state.selectors.filter((s: Selector) => s.selection);
			if (validSelections.length > 0) {
				await appStore.extractPaletteFromSelection();
			} else if (appStore.state.fileInput) {
				const files = Array.from(appStore.state.fileInput.files || []);
				await appStore.extractPalette(files);
			}
		}
	}
</script>

<div
	class={cn(
		'palette-dropdown-base flex min-w-max flex-col gap-2',
		popoverStore.state.direction === 'right' ? 'left-full ml-2' : 'right-full mr-2'
	)}
	style={popoverStore.state.direction === 'right' ? 'left: calc(100% + 0.5rem);' : 'right: calc(100% + 0.5rem);'}
>
	<h3 class="text-brand mb-1 text-sm font-medium">Palette Options</h3>
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
		<h3 class="text-brand mb-1 text-sm font-medium">Sample Options</h3>
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

	<div class="mt-3 flex items-center justify-between">
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
			onchange={(e) => (appStore.state.sampleRate = parseInt(e.currentTarget.value) || 30)}
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
		<h3 class="text-brand mb-1 text-sm font-medium">Color Filters</h3>
		<input
			type="text"
			value={newFilterColor}
			oninput={(e) => (appStore.state.newFilterColor = e.currentTarget.value)}
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

	<ul class="mb-3 flex flex-wrap gap-3">
		{#each filteredColors as color, i}
			<li class="flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-xs">
				<span>{color}</span>
				<button
					class="text-red-400 hover:text-red-600"
					onclick={() => (appStore.state.filteredColors = filteredColors.filter((_, index) => index !== i))}
					title="Remove"
					type="button"
				>
					×
				</button>
			</li>
		{/each}
	</ul>
</div>
