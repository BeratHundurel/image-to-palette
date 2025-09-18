<script lang="ts">
	import { getAppContext } from '$lib/context/context.svelte';
	import { type Selector } from '$lib/types/palette';

	let { selector, index = 0 } = $props<{
		selector: Selector;
		index?: number;
	}>();

	const { state: state } = getAppContext();

	function handleClick() {
		state.activeSelectorId = selector.id;
		state.selectors = state.selectors.map((s) => ({
			...s,
			selected: s.id === selector.id
		}));
	}
</script>

<li class="flex">
	<button class="palette-button-base" onclick={handleClick} aria-label="Selector {index + 1}">
		<div
			class="flex h-6 w-6 items-center justify-center rounded-full border-zinc-900"
			style="background-color: {selector.color}"
		>
			{#if selector.selected}
				<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#000"
					><path
						d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
					/></svg
				>
			{/if}
		</div>
	</button>
</li>
