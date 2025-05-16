<script lang="ts">
	import { type PaletteResponse, type Color } from '$lib/types/palette';
	import toast, { Toaster } from 'svelte-french-toast';
	import { scale } from 'svelte/transition';

	let palette: Color[] = [];
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let image: HTMLImageElement;
	let fileInput: HTMLInputElement;

	let imageLoaded = false;
	let isDragging = false;
	let startX = 0,
		startY = 0;

	let selection = { x: 0, y: 0, w: 0, h: 0 };

	// === File Upload ===

	async function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;

		await drawToCanvas(file);
		await uploadAndExtractPalette(file);
	}

	async function uploadAndExtractPalette(file: Blob) {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('http://localhost:8080/extract-palette', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) throw new Error();
			const result: PaletteResponse = await res.json();
			palette = result.palette;
			toast.success('Palette extracted');
		} catch {
			toast.error('Error extracting palette');
		}
	}

	// === Drawing & Selection ===

	function getMousePos(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		const pos = getMousePos(e);
		startX = pos.x;
		startY = pos.y;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const pos = getMousePos(e);

		selection = {
			x: Math.min(startX, pos.x),
			y: Math.min(startY, pos.y),
			w: Math.abs(pos.x - startX),
			h: Math.abs(pos.y - startY)
		};

		drawImageAndBox();
	}

	function handleMouseUp() {
		isDragging = false;
		if (selection.w && selection.h) extractPaletteFromSelection();
	}

	function drawImageAndBox() {
		if (!ctx || !image) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		if (selection.w && selection.h) {
			ctx.strokeStyle = 'lime';
			ctx.lineWidth = 2;
			ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
		}
	}

	async function drawToCanvas(file: File) {
		const reader = new FileReader();

		reader.onload = () => {
			image = new Image();
			image.onload = () => {
				ctx = canvas.getContext('2d')!;
				canvas.width = image.width;
				canvas.height = image.height;
				ctx.drawImage(image, 0, 0);
				imageLoaded = true;
			};
			image.src = reader.result as string;
		};

		reader.readAsDataURL(file);
	}

	// === Palette from Selection ===

	async function extractPaletteFromSelection() {
		if (!ctx || !canvas || !image || !selection.w || !selection.h) return;

		const cropCanvas = document.createElement('canvas');
		cropCanvas.width = selection.w;
		cropCanvas.height = selection.h;

		const cropCtx = cropCanvas.getContext('2d');
		if (!cropCtx) return;

		cropCtx.drawImage(
			image,
			selection.x,
			selection.y,
			selection.w,
			selection.h,
			0,
			0,
			selection.w,
			selection.h
		);

		const blob: Blob = await new Promise((resolve) =>
			cropCanvas.toBlob((b) => resolve(b!), 'image/png')
		);

		await uploadAndExtractPalette(blob);
	}

	// === UX Helpers ===

	function triggerFileSelect() {
		fileInput?.click();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			const input = document.createElement('input');
			input.type = 'file';
			input.files = dataTransfer.files;
			onFileChange({ target: input } as unknown as Event);
		}
	}

	function preventDefault(e: Event) {
		e.preventDefault();
	}

	function handleCopy(hex: string) {
		navigator.clipboard.writeText(hex).then(() => toast.success('Copied to clipboard'));
	}
</script>

<Toaster />

<div class="relative h-[100svh] bg-black text-white">
	<enhanced:img
		src="../lib/assets/palette.jpg"
		alt="Palette"
		class="absolute top-0 left-0 h-full w-full object-cover"
	/>

	<!-- Dark overlay -->
	<div class="absolute top-0 left-0 z-10 h-full w-full bg-black/60"></div>

	<!-- Content -->
	<div
		class="relative z-20 flex max-h-[100svh] min-h-[100svh] w-full flex-col items-center justify-center space-y-8 overflow-hidden px-4"
	>
		<h1 class="text-center text-4xl font-bold tracking-tight drop-shadow-lg md:text-5xl">
			{imageLoaded ? 'Crop a section of your image' : 'Upload your image to extract palette'}
		</h1>

		<div
			class="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
			class:opacity-0={imageLoaded}
			class:pointer-events-none={imageLoaded}
			class:opacity-100={!imageLoaded}
			class:pointer-events-auto={!imageLoaded}
		>
			<button
				ondrop={handleDrop}
				ondragover={preventDefault}
				ondragenter={preventDefault}
				ondragleave={preventDefault}
				onclick={triggerFileSelect}
				class="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/50 bg-white/10 p-12 text-white transition duration-300 hover:border-white hover:bg-white/20"
			>
				<svg
					viewBox="0 0 24 24"
					width="4rem"
					height="4rem"
					fill="#fff"
					class="mb-3 opacity-80 group-hover:opacity-100"
				>
					<path
						d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
					/>
				</svg>
				<span class="text-sm text-white/80 group-hover:text-white">Drop or click to upload</span>
				<input
					type="file"
					name="file"
					bind:this={fileInput}
					class="hidden"
					accept="image/*"
					onchange={onFileChange}
				/>
			</button>
		</div>

		<!-- Canvas: fade in/out + pointer-events toggle -->
		<canvas
			bind:this={canvas}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			class="mb-6 h-auto w-full max-w-3xl rounded-xl shadow-lg transition-opacity duration-300"
			class:opacity-100={imageLoaded}
			class:pointer-events-auto={imageLoaded}
			class:opacity-0={!imageLoaded}
			class:pointer-events-none={!imageLoaded}
		></canvas>

		<!-- Palette wrapper with min-height -->
		<div class="w-full max-w-5xl px-4">
			<div
				class="grid min-h-[90px] grid-cols-2 gap-4 transition-all duration-300 sm:grid-cols-4 md:grid-cols-5"
			>
				{#each palette as color, i (color.hex)}
					<div
						role="button"
						tabindex="0"
						onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && handleCopy(color.hex)}
						onclick={() => handleCopy(color.hex)}
						in:scale={{ delay: i * 80, duration: 300, start: 0.7 }}
						class="flex h-12 cursor-pointer items-center justify-center rounded-xl p-3 shadow-md"
						style="background-color: {color.hex}"
					>
						<span class="rounded bg-black/50 px-2 py-1 font-mono text-xs">{color.hex}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
