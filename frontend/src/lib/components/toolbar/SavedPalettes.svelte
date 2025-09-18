<script lang="ts">
	import { popovers } from '$lib/context/popovers.svelte';
</script>

<button
	class="palette-button-base border-zinc-700"
	onclick={(e) => popovers.toggle('saved', e)}
	aria-label="Show saved palettes"
	type="button"
>
	<span>🎨</span>
</button>
