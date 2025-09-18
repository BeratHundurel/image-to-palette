<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyOptions from './CopyOptions.svelte';
	import SelectorButton from './SelectorButton.svelte';
	import PaletteOptions from './PaletteOptions.svelte';
	import SavedPalettes from './SavedPalettes.svelte';
	import ApplicationSettings from './ApplicationSettings.svelte';
	import { fly } from 'svelte/transition';
	import { getAppContext } from '$lib/context/context.svelte';
	import { popovers, popoverState } from '$lib/context/popovers.svelte';

	// Import popover content components
	import PaletteOptionsPopover from './PaletteOptionsPopover.svelte';
	import ApplicationSettingsPopover from './ApplicationSettingsPopover.svelte';
	import CopyOptionsPopover from './CopyOptionsPopover.svelte';
	import SavedPalettesPopover from './SavedPalettesPopover.svelte';

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

	// Close popovers when toolbar is moved
	$effect(() => {
		if (moving) {
			popovers.close();
		}
	});
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
		<!-- Drag Handle -->
		<div
			bind:this={dragHandle}
			class={cn(
				'flex cursor-move items-center justify-center border-b border-zinc-700/50 p-4',
				'hover:border-brand hover:bg-zinc-800/50',
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

		<!-- Toolbar Content -->
		<div class="relative p-4">
			<!-- Main Controls -->
			<ul class="flex flex-col gap-3">
				<!-- Selection Tools Section -->
				{#if appState.selectors.length > 0}
					<li class="relative">
						<div class="mb-2 flex items-center gap-2">
							<h3 class="text-brand text-xs font-semibold tracking-wide uppercase">Selection Tools</h3>
							<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="flex flex-wrap justify-center gap-2">
							{#each appState.selectors as selector, i}
								<SelectorButton {selector} index={i} />
							{/each}
						</div>
					</li>
				{/if}
				<!-- Extraction Section -->
				<li class="relative">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-semibold tracking-wide uppercase">Extraction</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<PaletteOptions />
				</li>

				<!-- Processing Section -->
				<li class="relative">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-semibold tracking-wide uppercase">Processing</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<ApplicationSettings />
				</li>

				<!-- Output Section -->
				<li class="relative">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-semibold tracking-wide uppercase">Output</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<div class="flex justify-start gap-2">
						<SavedPalettes />
						<CopyOptions />
					</div>
				</li>
			</ul>
		</div>

		<!-- Popovers positioned relative to toolbar -->
		{#if popoverState.current === 'palette'}
			<div class="popover-container">
				<PaletteOptionsPopover />
			</div>
		{/if}

		{#if popoverState.current === 'application'}
			<div class="popover-container">
				<ApplicationSettingsPopover />
			</div>
		{/if}

		{#if popoverState.current === 'copy'}
			<div class="popover-container">
				<CopyOptionsPopover />
			</div>
		{/if}

		{#if popoverState.current === 'saved'}
			<div class="popover-container">
				<SavedPalettesPopover />
			</div>
		{/if}
	</div>
</section>

<style>
	.draggable {
		position: fixed;
		z-index: 1000; /* Higher z-index to stay above other elements */
		user-select: none;
	}

	.draggable.dragging {
		cursor: move;
		z-index: 1001; /* Even higher when dragging */
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

	/* Popover Container */
	.popover-container {
		position: absolute;
		top: 0;
		z-index: 10;
	}

	:global(.palette-button-base::before) {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: translateX(-100%);
		transition: transform 0.6s;
	}

	:global(.palette-button-base:hover) {
		border-color: rgba(161, 161, 170, 0.6);
		background-color: rgba(39, 39, 42, 0.9);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		transform: translateY(-1px);
	}

	:global(.palette-button-base:hover::before) {
		transform: translateX(100%);
	}

	:global(.palette-button-base:active) {
		transform: scale(0.95) translateY(0px);
		transition: transform 0.1s;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	:global(.palette-button-base:focus-visible) {
		outline: 2px solid rgba(161, 161, 170, 0.6);
		outline-offset: 2px;
		border-color: rgba(161, 161, 170, 0.8);
	}

	/* Position popovers relative to toolbar direction */
	:global(.palette-dropdown-base.left-full) {
		left: calc(100% + 0.5rem);
	}

	:global(.palette-dropdown-base.right-full) {
		right: calc(100% + 0.5rem);
	}

	@keyframes fadeInZoom {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Section spacing improvements */
	li:not(:last-child) {
		border-bottom: 1px solid rgba(39, 39, 42, 0.5);
		padding-bottom: 1rem;
	}

	/* Enhanced visual feedback for sections */
	li:hover .from-brand\/40 {
		background: linear-gradient(to right, rgba(238, 179, 143, 0.6), transparent);
	}

	/* Scrollbar styles for popovers */
	:global(.palette-dropdown-base::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.palette-dropdown-base::-webkit-scrollbar-track) {
		background: rgba(63, 63, 70, 0.5);
		border-radius: 3px;
	}

	:global(.palette-dropdown-base::-webkit-scrollbar-thumb) {
		background: rgba(161, 161, 170, 0.5);
		border-radius: 3px;
	}

	:global(.palette-dropdown-base::-webkit-scrollbar-thumb:hover) {
		background: rgba(161, 161, 170, 0.7);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.draggable {
			position: fixed;
			right: 1rem !important;
			top: 1rem !important;
		}

		:global(.palette-dropdown-base) {
			max-width: 90vw;
			left: auto !important;
			right: 0 !important;
			margin-right: 0 !important;
			margin-left: 0 !important;
		}
	}
</style>
