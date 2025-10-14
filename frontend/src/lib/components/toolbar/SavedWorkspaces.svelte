<script lang="ts">
	import { popoverStore } from '$lib/stores/popovers.svelte';
</script>

<button
	class="toolbar-button-base"
	onclick={(e) => popoverStore.toggle('workspaces', e)}
	aria-label="Show saved workspaces"
	title="View and load saved workspaces"
	type="button"
>
	<span>💾</span>
</button>
