<script lang="ts">
	import type { Color } from '$lib/types/palette';
	import { cn } from '$lib/utils';
	import { appStore } from '$lib/stores/app.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	function handlePaletteLoad(palette: Color[]) {
		appStore.state.colors = palette;
		appStore.applyPalette();
		popoverStore.close('saved');
	}

	async function handlePaletteDelete(paletteId: string, paletteName: string) {
		if (confirm(`Are you sure you want to delete "${paletteName}"?`)) {
			await appStore.deletePalette(paletteId);
		}
	}
</script>

<div
	class={cn(
		'palette-dropdown-base w-80',
		popoverStore.state.direction === 'right' ? 'left-full ml-2' : 'right-full mr-2'
	)}
	style={`min-width: 260px; ${popoverStore.state.direction === 'right' ? 'left: calc(100% + 0.5rem);' : 'right: calc(100% + 0.5rem);'}`}
>
	<h3 class="text-brand mb-3 text-sm font-medium">Saved Palettes</h3>
	<div class="scrollable-content custom-scrollbar max-h-72 overflow-y-auto">
		{#if appStore.state.savedPalettes.length === 0}
			<div class="py-8 text-center text-zinc-300">No saved palettes yet.</div>
		{:else}
			<ul class="flex flex-col gap-4">
				{#each appStore.state.savedPalettes as item}
					<li class="flex flex-col gap-2 rounded border border-zinc-600 bg-zinc-800/50 px-2 py-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-brand max-w-[120px] truncate font-mono text-xs" title={item.name}>
								{item.name}
							</span>
							<div class="flex items-center gap-3">
								<button
									class="text-brand hover:text-brand/75 cursor-pointer rounded text-xs font-medium"
									onclick={() => handlePaletteLoad(item.palette)}
									type="button"
								>
									Apply
								</button>
								<button
									class="cursor-pointer rounded text-xs font-medium text-red-400 hover:text-red-300"
									onclick={() => handlePaletteDelete(item.id, item.name)}
									type="button"
									title="Delete palette"
								>
									Delete
								</button>
							</div>
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
						<div class="mt-2 text-xs text-zinc-400">
							Created: {new Date(item.createdAt).toLocaleDateString()}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #eeb38f transparent;
		padding: 5px;
	}
</style>
