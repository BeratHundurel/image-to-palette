<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
	import { type Selector } from '$lib/types/palette';
	import { cn } from '$lib/utils';

	let { selector, index = 0 } = $props<{
		selector: Selector;
		index?: number;
	}>();

	function handleClick() {
		appStore.state.activeSelectorId = selector.id;
		appStore.state.selectors = appStore.state.selectors.map((s) => ({
			...s,
			selected: s.id === selector.id
		}));
	}
</script>

<button
	class={cn(
		'group relative transition-all duration-200 ease-out',
		'h-11 w-11 overflow-hidden rounded-lg border-2',
		'hover:scale-105 active:scale-95',
		'focus-visible:ring-brand/50 focus-visible:ring-2 focus-visible:outline-none',
		selector.selected
			? 'border-brand shadow-brand/20 ring-brand/30 shadow-lg ring-2'
			: 'border-zinc-600 hover:border-zinc-400'
	)}
	onclick={handleClick}
	aria-label="Selector {index + 1}"
	type="button"
>
	<!-- Color Background -->
	<div class="absolute inset-0 transition-all duration-200" style="background-color: {selector.color}">
		<!-- Overlay for better contrast -->
		<div class="absolute inset-0 bg-black/10 transition-colors duration-200 group-hover:bg-black/5"></div>
	</div>

	<!-- Selection Indicator -->
	{#if selector.selected}
		<div class="relative z-10 flex h-full w-full items-center justify-center">
			<div class="rounded-full bg-black/30 p-1 backdrop-blur-sm">
				<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="white">
					<path
						d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
					/>
				</svg>
			</div>
		</div>
	{/if}

	<!-- Selector Number Badge -->
	<div
		class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-xs font-medium text-zinc-300"
	>
		{index + 1}
	</div>

	<!-- Hover Effect -->
	<div
		class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	></div>
</button>
