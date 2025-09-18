<script lang="ts">
	// === Imports ===
	import { type Color } from '$lib/types/palette';
	import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
	import { Toaster } from 'svelte-french-toast';
	import { onMount } from 'svelte';
	import { setAppContext, type AppContext, createAppContext } from '$lib/context/context.svelte';
	import { getSavedPaletteNames } from '$lib/context/palette';
	import * as api from '$lib/api/palette';
	import Canvas from '$lib/components/Canvas.svelte';
	import UploadOverlay from '$lib/components/UploadOverlay.svelte';
	import PaletteGrid from '$lib/components/PaletteGrid.svelte';

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

	// === Context Setup ===
	const { state: state, actions: actions } = createAppContext();
	setAppContext({ state, actions } as AppContext);
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

		<Canvas />

		{#if state.imageLoaded}
			<Toolbar />
		{/if}

		<PaletteGrid />
	</div>
</div>
