<script lang="ts">
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';

	export let options: { label: string; value: string }[] = [];
	export let value: string;
	export let onChange: (v: string) => void;

	let isOpen = false;

	function selectOption(option: string) {
		value = option;
		onChange(option);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}
</script>

<div class="relative w-48">
	<button
		onclick={toggleDropdown}
		class="flex w-full items-center justify-between rounded border border-[#D09E87] bg-transparent px-4 py-2 text-white focus:ring-1 focus:ring-[#D09E87] focus:outline-none"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span>{options.find((o) => o.value === value)?.label ?? 'Select an option'}</span>
		<svg
			class={cn(
				'ml-2 h-4 w-4 stroke-[#D09E87] transition-transform duration-200',
				isOpen ? 'rotate-180' : 'rotate-0'
			)}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded border border-[#D09E87] bg-transparent shadow-sm focus:outline-none"
			tabindex="-1"
			role="listbox"
			transition:slide={{ duration: 200 }}
		>
			{#each options as option}
				<button
					onclick={() => selectOption(option.value)}
					class="w-full cursor-pointer px-2 py-1 text-left text-sm tracking-tight text-white hover:bg-[#D09E87] focus:bg-[#D09E87]"
					role="option"
					aria-selected={option.value === value}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
