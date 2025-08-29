<script lang="ts">
	import type { Color, NamedColor } from '$lib/types/palette';
	import { cn } from '$lib/utils';
	import toast from 'svelte-french-toast';
	import { popovers, popoverState } from '$lib/context/popovers.svelte';
	import { getAppContext } from '$lib/context/context.svelte';

	const { state: toolbar } = getAppContext();

	const copy_options = [
		{ label: 'JSON', value: 'json' },
		{ label: 'CSS Variables', value: 'css_variables' },
		{ label: 'Tailwind Config', value: 'tailwind_config' },
		{ label: 'Bootstrap Variables', value: 'bootstrap_variables' }
	];

	function handleCopyFormatChange(format: string) {
		if (toolbar.colors.length > 0) {
			copyPaletteAs(format, toolbar.colors);

			popovers.close('copy');
		} else {
			toast.error('No palette to copy');
		}
	}

	async function copyPaletteAs(format: string, palette: Color[]) {
		let output = '';
		const hexValues = palette.map((c) => c.hex);
		const namedPalette = await getNamedPalette(hexValues);
		switch (format) {
			case 'json':
				output = JSON.stringify(namedPalette, null, 2);
				break;
			case 'css_variables':
				output = namedPalette.map((c) => `--color-${c.name}: ${c.hex};`).join('\n');
				break;
			case 'tailwind_config':
				output = generateTailwindThemeBlock(namedPalette);
				break;
			case 'bootstrap_variables':
				output = generateBootstrapVariables(namedPalette);
				break;
		}
		navigator.clipboard.writeText(output);
		toast.success(`${format.replace('_', ' ').toUpperCase()} copied to clipboard`);
	}

	async function getNamedPalette(hexValues: string[]): Promise<NamedColor[]> {
		const url = `https://api.color.pizza/v1/?values=${hexValues.map((h) => h.replace('#', '')).join(',')}`;
		const res = await fetch(url);
		if (!res.ok) return [];
		const data = await res.json();
		return data.colors.map((c: NamedColor) => ({
			name: slugifyName(c.name),
			hex: c.hex.toLowerCase()
		}));
	}

	function generateTailwindThemeBlock(colors: NamedColor[]) {
		return `@theme {\n${colors.map((c) => `  --color-${c.name}: ${c.hex};`).join('\n')}\n}`;
	}

	function generateBootstrapVariables(colors: NamedColor[]) {
		return `:root {\n${colors.map((c) => `  --bs-${c.name}: ${c.hex};`).join('\n')}\n}`;
	}

	function slugifyName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
</script>

<li class="relative">
	<button class="palette-button-base" aria-label="Copy Palette" onclick={(e) => popovers.toggleFromEvent('copy', e)}>
		<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#eeb38f"
			><path
				d="M120-220v-80h80v80h-80Zm0-140v-80h80v80h-80Zm0-140v-80h80v80h-80ZM260-80v-80h80v80h-80Zm100-160q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480Zm40 240v-80h80v80h-80Zm-200 0q-33 0-56.5-23.5T120-160h80v80Zm340 0v-80h80q0 33-23.5 56.5T540-80ZM120-640q0-33 23.5-56.5T200-720v80h-80Zm420 80Z"
			/></svg
		>
	</button>

	{#if popoverState.current === 'copy'}
		<div
			class={cn(
				'palette-dropdown-base border-brand/40 w-80',
				popoverState.direction === 'right' ? 'left-14 ml-1' : 'right-14 mr-1'
			)}
		>
			<p class="text-brand mb-2 text-sm font-bold">Copy Palette</p>

			{#each copy_options as option}
				<button
					class="text-brand hover:bg-brand focus:bg-brand mb-2 w-full cursor-pointer rounded bg-zinc-800 px-2 py-1 text-xs font-medium hover:text-black focus:text-black"
					onclick={() => handleCopyFormatChange(option.value)}
					type="button"
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</li>
