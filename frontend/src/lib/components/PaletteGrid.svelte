<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
	import { tutorialStore } from '$lib/stores/tutorial.svelte';
	import { copyToClipboard } from '$lib/utils';
	import { tick } from 'svelte';
	import toast from 'svelte-french-toast';
	import { fly, scale } from 'svelte/transition';

	async function handleCopy(hex: string) {
		try {
			await copyToClipboard(hex, (message) => toast.success(message));
			tutorialStore.setColorCopied(true);
		} catch (error) {
			toast.error('Failed to copy to clipboard');
		}
	}

	async function returnToUpload() {
		await tick();
		appStore.state.imageLoaded = false;
		if (appStore.state.fileInput) {
			appStore.state.fileInput.value = '';
		}
		appStore.state.colors = [];
		appStore.state.activeSelectorId = 'green';
		appStore.state.selectors.forEach((s) => {
			s.selection = undefined;
			s.selected = s.id === 'green';
		});
	}
</script>

<section class="w-full max-w-5xl">
	<div class="grid min-h-12 grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-8">
		{#each appStore.state.colors as color, i}
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

	{#if appStore.state.imageLoaded}
		<div transition:fly={{ x: 300, duration: 500 }} class="mt-4 flex flex-row justify-between">
			<button
				class="border-brand/50 hover:shadow-brand w-36 cursor-pointer rounded border bg-zinc-900 py-2 text-sm font-medium tracking-tight shadow-2xl transition-all hover:-translate-y-1"
				onclick={returnToUpload}>Back</button
			>

			<button
				class="border-brand/50 hover:shadow-brand ml-4 flex w-36 cursor-pointer items-center justify-center gap-2 rounded border bg-zinc-900 py-2 text-center text-sm font-medium transition-all hover:-translate-y-1"
				onclick={appStore.savePalette}
			>
				Save Palette

				<span> 💾 </span>
			</button>
		</div>
	{/if}
</section>
