<script lang="ts">
	import { cn } from '$lib/utils';
	import { appStore } from '$lib/stores/app.svelte';

	async function handleDownload() {
		await appStore.downloadImage();
	}
</script>

<button
	id="download-button"
	onclick={handleDownload}
	class={cn(
		'palette-button-base',
		'relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-zinc-700 bg-zinc-800/60 text-zinc-300 outline-0 transition-all duration-300 ease-out',
		'hover:border-brand/50 hover:bg-brand/10 hover:text-brand',
		'active:scale-95'
	)}
	disabled={appStore.state.isExtracting}
	aria-label="Download image"
>
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
		/>
	</svg>
</button>
