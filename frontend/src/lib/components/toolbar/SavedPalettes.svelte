<script lang="ts">
	import { popoverStore } from '$lib/stores/popovers.svelte';
</script>

<button
	class="palette-button-base border-zinc-700"
	onclick={(e) => popoverStore.toggle('saved', e)}
	aria-label="Show saved palettes"
	type="button"
>
	<span>🎨</span>
</button>
