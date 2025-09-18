<script lang="ts">
	import type { Color } from '$lib/types/palette';
	import { cn } from '$lib/utils';
	import { getAppContext } from '$lib/context/context.svelte';
	import { popovers, popoverState } from '$lib/context/popovers.svelte';

	const { state: state, actions } = getAppContext();

	function handlePaletteLoad(palette: Color[]) {
		state.colors = palette;
		actions.palette.applyPaletteToImage();
		popovers.close('saved');
	}
</script>

<div
	class={cn('palette-dropdown-base w-80', popoverState.direction === 'right' ? 'left-full ml-2' : 'right-full mr-2')}
	style={`min-width: 260px; ${popoverState.direction === 'right' ? 'left: calc(100% + 0.5rem);' : 'right: calc(100% + 0.5rem);'}`}
>
	<h3 class="text-brand mb-3 text-sm font-medium">Saved Palettes</h3>
	<div class="max-h-64 overflow-y-auto">
		{#if state.loadingSavedPalettes}
			<div class="py-8 text-center text-white/70">Loading...</div>
		{:else if state.savedPalettes.length === 0}
			<div class="py-8 text-center text-white/70">No saved palettes yet.</div>
		{:else}
			<ul class="flex flex-col gap-3">
				{#each state.savedPalettes as item}
					<li class="flex flex-col gap-1 rounded border border-zinc-700/60 bg-zinc-800/70 p-2">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-brand max-w-[120px] truncate font-mono text-xs" title={item.fileName}>
								{item.fileName}
							</span>
							<button
								class="text-brand cursor-pointer rounded text-xs font-bold"
								onclick={() => handlePaletteLoad(item.palette)}
								type="button"
							>
								Apply
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
