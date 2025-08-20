<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyOptions from './CopyOptions.svelte';
	import SelectorButton from './SelectorButton.svelte';
	import PaletteOptions from './PaletteOptions.svelte';
	import SavedPalettes from './SavedPalettes.svelte';
	import { fly } from 'svelte/transition';
	import { getToolbarContext } from './context';

	// === Context ===
	const { state: toolbar, actions } = getToolbarContext();

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
			'border-brand/40 rounded-lg border bg-zinc-900 shadow-2xl ',
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
				{#each toolbar.selectors as selector, i}
					<SelectorButton {selector} index={i} onSelect={actions.onSelectorSelect} />
				{/each}

				<PaletteOptions />

				<SavedPalettes />

				<CopyOptions />
			</ul>
		</div>
	</div>
</section>
