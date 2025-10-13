<script lang="ts">
	import { appStore } from '$lib/stores/app.svelte';
	import { preventDefault } from '$lib/utils';
</script>

<section
	class="absolute inset-0 flex flex-col items-center justify-around transition-opacity duration-300"
	class:opacity-0={appStore.state.imageLoaded}
	class:pointer-events-none={appStore.state.imageLoaded}
	class:opacity-100={!appStore.state.imageLoaded}
	class:pointer-events-auto={!appStore.state.imageLoaded}
	aria-hidden={appStore.state.imageLoaded ? 'true' : 'false'}
>
	<button
		type="button"
		ondrop={appStore.handleDrop}
		ondragover={preventDefault}
		ondragenter={preventDefault}
		ondragleave={preventDefault}
		onclick={appStore.triggerFileSelect}
		class="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/10 p-12 transition-all duration-300 hover:border-white hover:bg-white/20"
		aria-label="Upload an image or drag and drop it here"
	>
		<svg
			viewBox="0 0 24 24"
			width="4rem"
			height="4rem"
			fill="#fff"
			role="img"
			aria-label="Upload icon"
			class="mb-3 opacity-80 transition-opacity group-hover:opacity-100"
		>
			<path
				d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
			/>
		</svg>
		<span class="text-sm text-zinc-300 group-hover:text-white"> Upload an image or drag and drop it here </span>
		<input
			type="file"
			name="file"
			bind:this={appStore.state.fileInput}
			class="hidden"
			accept="image/*"
			oninput={appStore.onFileChange}
			aria-label="Choose image to extract a palette from"
		/>
	</button>
</section>
