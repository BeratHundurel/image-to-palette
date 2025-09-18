<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyOptions from './CopyOptions.svelte';
	import SelectorButton from './SelectorButton.svelte';
	import PaletteOptions from './PaletteOptions.svelte';
	import SavedPalettes from './SavedPalettes.svelte';
	import ApplicationSettings from './ApplicationSettings.svelte';
	import { fly } from 'svelte/transition';
	import { getAppContext } from '$lib/context/context.svelte';

	// === Context ===
	const { state: appState } = getAppContext();

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
			<ul class="flex flex-col gap-3">
				{#each appState.selectors as selector, i}
					<SelectorButton {selector} index={i} />
				{/each}

				<PaletteOptions />

				<SavedPalettes />

				<ApplicationSettings />

				<CopyOptions />
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
