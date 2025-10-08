<script lang="ts">
	import { cn } from '$lib/utils';
	import CopyOptions from './CopyOptions.svelte';
	import SelectorButton from './SelectorButton.svelte';
	import PaletteOptions from './PaletteOptions.svelte';
	import SavedPalettes from './SavedPalettes.svelte';
	import ApplicationSettings from './ApplicationSettings.svelte';
	import PaletteOptionsPopover from './popovers/PaletteOptionsPopover.svelte';
	import ApplicationSettingsPopover from './popovers/ApplicationSettingsPopover.svelte';
	import CopyOptionsPopover from './popovers/CopyOptionsPopover.svelte';
	import SavedPalettesPopover from './popovers/SavedPalettesPopover.svelte';
	import Download from './Download.svelte';
	import { fly } from 'svelte/transition';
	import { appStore } from '$lib/stores/app.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	// === Drag State ===
	let right = $state(75);
	let top = $state(75);
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

	$effect(() => {
		if (moving) {
			popoverStore.close();
		}
	});
</script>

<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMouseMove} />

<section
	role="toolbar"
	tabindex="0"
	onmousedown={handleMouseDown}
	style="right: {right}px; top: {top}px;"
	class={cn('fixed z-50 select-none', moving ? 'z-[51] cursor-move [&_*]:pointer-events-none' : '')}
	transition:fly={{ y: -300, duration: 500 }}
>
	<div
		class={cn(
			'border-brand/50 rounded-lg border bg-zinc-900 shadow-2xl ',
			'hover:shadow-brand hover:border-zinc-600',
			'transition-all duration-300 ease-out'
		)}
	>
		<!-- Drag Handle -->
		<div
			bind:this={dragHandle}
			class={cn(
				'flex cursor-move items-center justify-center border-b border-zinc-700/50 px-5 py-4',
				'hover:border-brand/40 hover:bg-zinc-800/50',
				'transition-all duration-200 ease-out'
			)}
		>
			<div class="flex flex-col items-center gap-1.5">
				<div
					class={cn(
						'h-0.5 w-8 rounded-full transition-all duration-200 ease-out',
						moving ? 'bg-brand/80 shadow-brand' : 'bg-zinc-400/80'
					)}
				></div>
				<div
					class={cn(
						'h-0.5 w-6 rounded-full transition-all duration-200 ease-out',
						moving ? 'bg-brand/50 shadow-brand' : 'bg-zinc-400/50'
					)}
				></div>
			</div>
		</div>

		<div class="relative p-5">
			<ul class="flex flex-col gap-3">
				{#if appStore.state.selectors.length > 0}
					<li class="relative border-b border-zinc-600/50 pb-4 last:border-b-0">
						<div class="mb-2 flex items-center gap-2">
							<h3 class="text-brand text-xs font-medium tracking-wide uppercase">Selection Tools</h3>
							<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="flex flex-wrap justify-center gap-2">
							{#each appStore.state.selectors as selector, i}
								<SelectorButton {selector} index={i} />
							{/each}
						</div>
					</li>
				{/if}

				<!-- Processing Section -->
				<li class="relative border-b border-zinc-600/50 pb-4 last:border-b-0">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-medium tracking-wide uppercase">Processing</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<div class="flex justify-start gap-2">
						<SavedPalettes />
						<ApplicationSettings />
					</div>
				</li>

				<!-- Extraction Section -->
				<li class="relative border-b border-zinc-600/50 pb-4 last:border-b-0">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-medium tracking-wide uppercase">Extraction</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<PaletteOptions />
				</li>

				<!-- Copy Section -->
				<li class="relative border-b border-zinc-600/50 pb-4 last:border-b-0">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-medium tracking-wide uppercase">Copy</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<div class="flex justify-start gap-2">
						<CopyOptions />
					</div>
				</li>

				<!-- Export Section -->
				<li class="relative border-b border-zinc-600/50 pb-4 last:border-b-0">
					<div class="mb-2 flex items-center gap-2">
						<h3 class="text-brand text-xs font-medium tracking-wide uppercase">Export</h3>
						<div class="from-brand/40 h-px flex-1 bg-gradient-to-r to-transparent"></div>
					</div>
					<div class="flex justify-start gap-2">
						<Download />
					</div>
				</li>
			</ul>
		</div>

		{#if popoverStore.state.current === 'palette'}
			<PaletteOptionsPopover />
		{/if}

		{#if popoverStore.state.current === 'application'}
			<ApplicationSettingsPopover />
		{/if}

		{#if popoverStore.state.current === 'copy'}
			<CopyOptionsPopover />
		{/if}

		{#if popoverStore.state.current === 'saved'}
			<SavedPalettesPopover />
		{/if}
	</div>
</section>

<style>
	/* Popover Container */
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

	/* Enhanced visual feedback for sections */
	li:hover .from-brand\/40 {
		background: linear-gradient(to right, rgba(238, 179, 143, 0.6), transparent);
	}
</style>
