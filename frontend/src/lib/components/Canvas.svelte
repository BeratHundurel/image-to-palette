<script lang="ts">
	import { getAppContext } from '$lib/context/context.svelte';

	const { state, actions } = getAppContext();
</script>

<section class="mb-6 grid grid-cols-4">
	<div></div>
	<div class="col-span-2">
		<canvas
			bind:this={state.canvas}
			onmousedown={actions.canvas.handleMouseDown}
			onmousemove={actions.canvas.handleMouseMove}
			onmouseup={actions.canvas.handleMouseUp}
			class="rounded-xl border border-gray-300 shadow-lg transition-opacity duration-300"
			class:opacity-100={state.imageLoaded}
			class:pointer-events-auto={state.imageLoaded}
			class:opacity-0={!state.imageLoaded}
			class:pointer-events-none={!state.imageLoaded}
		></canvas>
	</div>
</section>
