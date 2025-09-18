<script lang="ts">
	import { popovers } from '$lib/context/popovers.svelte';
</script>

<li>
	<div class="relative" style="display: inline-block;">
		<button
			class="palette-button-base border-zinc-700"
			onclick={(e) => popovers.toggleFromEvent('saved', e)}
			aria-label="Show saved palettes"
			type="button"
		>
			<span>🎨</span>
		</button>
	</div>
</li>
