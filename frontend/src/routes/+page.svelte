<div class="relative h-[100svh]">
	<enhanced:img
		src="../lib/assets/palette.jpg"
		alt="Palette"
		class="absolute top-0 left-0 h-full w-full object-cover"
	/>

	<!-- Dark overlay -->
	<div class="absolute top-0 left-0 z-10 h-full w-full bg-black/60"></div>

	<!-- Upload form -->
	<form
		class="absolute top-0 left-0 z-20 flex h-full w-full flex-col items-center justify-center space-y-6"
	>
		<h1 class="text-3xl font-bold text-white drop-shadow-md md:text-4xl">
			Upload an Image to Extract Colors
		</h1>

		<label
			class="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-white bg-white/10 p-12 text-white transition hover:bg-white/20"
		>
			<svg viewBox="0 0 24 24" width="5rem" height="5rem" fill="#fff"
				><path
					d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
				></path></svg
			>
			<span class="text-sm">Click to upload</span>
			<input type="file" class="hidden" />
		</label>
	</form>
</div>
