<script lang="ts">
	// === Imports ===
	import { type Color } from '$lib/types/palette';
	import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
	import { tick } from 'svelte';
	import toast, { Toaster } from 'svelte-french-toast';
	import { fly, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import {
		createAppActions,
		createAppStateInitializer,
		setAppContext,
		type AppState,
		type AppActions,
		type AppContext
	} from '$lib/context/context.svelte';
	import { copyToClipboard, getSavedPaletteNames } from '$lib/utils';
	import UploadOverlay from '$lib/components/upload/UploadOverlay.svelte';
	import * as api from '$lib/api/palette';

	onMount(async () => {
		const fileNames = getSavedPaletteNames();

		if (fileNames.length === 0) {
			state.savedPalettes = [];
			return;
		}

		const results: { fileName: string; palette: Color[] }[] = [];

		await Promise.all(
			fileNames.map(async (fileName) => {
				try {
					const res = await api.getPalette(fileName);
					if (Array.isArray(res.palette)) {
						results.push({ fileName, palette: res.palette });
					}
				} catch {}
			})
		);

		state.savedPalettes = results;
	});

	async function handleCopy(hex: string) {
		try {
			await copyToClipboard(hex, (message) => toast.success(message));
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	}

	// === State Reset ===
	async function returnToUpload() {
		await tick();
		state.imageLoaded = false;
		if (state.fileInput) {
			state.fileInput.value = '';
		}
		state.colors = [];
		state.activeSelectorId = 'green';
		state.selectors.forEach((s) => {
			s.selection = undefined;
			s.selected = s.id === 'green';
		});
	}

	const state = $state<AppState>(createAppStateInitializer());

	const ctx: AppContext = { state, actions: {} as AppActions };
	const actions = createAppActions(ctx);

	ctx.actions = actions;

	setAppContext(ctx);
</script>

<Toaster />

<div class="relative h-[100svh] bg-black text-white">
	<enhanced:img
		src="../lib/assets/palette.jpg"
		alt="Palette"
		class="absolute top-0 left-0 h-full w-full object-cover"
	/>

	<!-- Dark overlay -->
	<div class="absolute top-0 left-0 z-10 h-full w-full bg-black/60"></div>

	<div class="relative z-20 flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
		<UploadOverlay />

		<section class="mb-6 grid grid-cols-4">
			<div></div>
			<div class="col-span-2">
				<canvas
					bind:this={state.canvas}
					onmousedown={actions.canvas.handleMouseDown}
					onmousemove={actions.canvas.handleMouseMove}
					onmouseup={actions.canvas.handleMouseUp}
					class="rounded-xl border border-gray-300 shadow-lg transition-opacity duration-300"
					class:opacity-100={state.imageLoaded}
					class:pointer-events-auto={state.imageLoaded}
					class:opacity-0={!state.imageLoaded}
					class:pointer-events-none={!state.imageLoaded}
				></canvas>
			</div>
		</section>

		{#if state.imageLoaded}
			<Toolbar />
		{/if}

		<section class="w-full max-w-5xl">
			<div class="grid min-h-12 grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-8">
				{#each state.colors as color, i}
					<div
						role="button"
						tabindex="0"
						onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && handleCopy(color.hex)}
						onclick={() => handleCopy(color.hex)}
						in:scale={{ delay: i * 80, duration: 300, start: 0.7 }}
						class="flex h-9 cursor-pointer items-center justify-center rounded-lg p-2 shadow-md"
						style="background-color: {color.hex}"
					>
						<span class="rounded bg-black/50 px-2 py-1 font-mono text-xs">{color.hex}</span>
					</div>
				{/each}
			</div>

			{#if state.imageLoaded}
				<div transition:fly={{ x: 300, duration: 500 }} class="mt-4 flex flex-row justify-between">
					<button
						class="cursor-pointer rounded border border-[#D09E87] px-4 py-2 text-sm font-bold tracking-tight transition-all hover:-translate-y-2 hover:bg-[#D09E87]"
						onclick={returnToUpload}>Back</button
					>

					<button
						class="ml-4 flex cursor-pointer items-center gap-2 rounded border border-[#D09E87] px-4 py-2 text-sm font-bold transition-all hover:-translate-y-1 hover:bg-[#D09E87]"
						onclick={actions.palette.savePaletteToFile}
					>
						Save Palette

						<span> 💾 </span>
					</button>
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
