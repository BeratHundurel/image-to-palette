<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	function handleClick(e: MouseEvent) {
		if (!appStore.state.colors || appStore.state.colors.length === 0) {
			return;
		}
		popoverStore.toggle('themeExport', e);
	}

	const hasColors = $derived(appStore.state.colors.length > 0);
</script>

<button
	onclick={handleClick}
	disabled={!hasColors}
	class="toolbar-button-base flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
	title="Export VS Code Theme"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" x2="12" y1="15" y2="3" />
	</svg>
	<span>Theme</span>
</button>
