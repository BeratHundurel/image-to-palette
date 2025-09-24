<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
</script>

<section class="mb-6 grid grid-cols-4">
	<div></div>
	<div class="col-span-2">
		<canvas
			bind:this={appStore.state.canvas}
			onmousedown={appStore.handleMouseDown}
			onmousemove={appStore.handleMouseMove}
			onmouseup={appStore.handleMouseUp}
			class="rounded-xl border border-gray-300 shadow-lg transition-opacity duration-300"
			class:opacity-100={appStore.state.imageLoaded}
			class:pointer-events-auto={appStore.state.imageLoaded}
			class:opacity-0={!appStore.state.imageLoaded}
			class:pointer-events-none={!appStore.state.imageLoaded}
		></canvas>
	</div>
</section>
