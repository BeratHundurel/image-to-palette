<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
	import { cn } from '$lib/utils';
</script>

<section class="mb-6 grid grid-cols-4">
	<div></div>
	<div class="col-span-2">
		<canvas
			bind:this={appStore.state.canvas}
			onmousedown={appStore.handleMouseDown}
			onmousemove={appStore.handleMouseMove}
			onmouseup={appStore.handleMouseUp}
			class={cn(
				'rounded-xl border border-zinc-600 shadow-lg',
				appStore.state.imageLoaded ? 'pointer-events-auto block' : 'pointer-events-none hidden'
			)}
		></canvas>
	</div>
</section>
