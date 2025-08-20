<script lang="ts">
	import type { Color } from '$lib/types/palette';
	import { cn } from '$lib/utils';
	import toast from 'svelte-french-toast';
	import { popovers, popoverState } from '$lib/stores/popovers';
	import { getToolbarContext } from './context';

	const { state: toolbar, actions } = getToolbarContext();

	function handlePaletteLoad(palette: Color[]) {
		actions.onPaletteLoad([...palette]);
		popovers.close('saved');
		toast.success('Palette loaded!');
	}
</script>

<li>
	<div class="relative" style="display: inline-block;">
		<button
			class="palette-button-base border-zinc-700"
			onclick={(e) => popovers.toggleFromEvent('saved', e)}
			aria-label="Show saved palettes"
			type="button"
		>
			<span>🎨</span>
		</button>

		{#if $popoverState.current === 'saved'}
			<div
				class={cn(
					'palette-dropdown-base border-brand/40 w-80',
					$popoverState.direction === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
				)}
				style="min-width: 260px;"
			>
				<p class="text-brand mb-2 text-sm font-bold">Saved Palettes</p>
				<div class="max-h-64 overflow-y-auto">
					{#if toolbar.loadingSavedPalettes}
						<div class="py-8 text-center text-white/70">Loading...</div>
					{:else if toolbar.savedPalettes.length === 0}
						<div class="py-8 text-center text-white/70">No saved palettes yet.</div>
					{:else}
						<ul class="flex flex-col gap-3">
							{#each toolbar.savedPalettes as item}
								<li class="flex flex-col gap-1 rounded border border-zinc-700/60 bg-zinc-800/70 p-2">
									<div class="flex items-center justify-between">
										<span class="text-brand max-w-[120px] truncate font-mono text-xs" title={item.fileName}>
											{item.fileName}
										</span>
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
