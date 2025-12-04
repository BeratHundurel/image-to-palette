<script lang="ts">
	import { searchWallhaven } from '$lib/api/wallhaven';
	import { appStore } from '$lib/stores/app.svelte';
	import type { WallhavenResult } from '$lib/types/wallhaven';
	import toast from 'svelte-french-toast';
	import { fly } from 'svelte/transition';

	let { isOpen = $bindable() } = $props();

	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (isOpen && inputEl) {
			inputEl.focus();
		}
	});

	let results = $state<WallhavenResult[]>([]);
	let isSearching = $state(false);
	let loadingMore = $state(false);
	let page = $state(1);
	let hasMore = $state(true);

	async function performSearch(q: string, p = 1, append = false) {
		if (!q) {
			results = [];
			hasMore = true;
			page = 1;
			return;
		}

		if (p <= 1) {
			isSearching = true;
		} else {
			loadingMore = true;
		}

		try {
			const res = await searchWallhaven({
				q,
				page: p,
				purity: '100',
				categories: '111',
				sorting: 'random',
				order: 'desc'
			});
			const data = res.data || [];
			if (append) {
				const existingIds = new Set(results.map((r) => r.id));
				const newItems = data.filter((d) => !existingIds.has(d.id));
				if (newItems.length > 0) {
					results = [...results, ...newItems];
				} else {
					hasMore = false;
				}
			} else {
				results = data;
			}

			const meta = res.meta ?? {};
			const lastPage =
				typeof meta.last_page === 'number'
					? meta.last_page
					: typeof meta.per_page === 'number' && typeof meta.total === 'number'
						? Math.ceil(meta.total / meta.per_page)
						: null;

			if (hasMore) {
				if (lastPage !== null) {
					hasMore = p < lastPage;
				} else {
					hasMore = data.length > 0;
				}
			}
			page = p;
		} catch {
			if (!append) results = [];
			hasMore = false;
		} finally {
			isSearching = false;
			loadingMore = false;
		}
	}

	let _timer: number | null = null;

	function scheduleSearch(q: string) {
		if (!isOpen) return;

		if (_timer !== null) {
			clearTimeout(_timer);
		}

		_timer = window.setTimeout(() => {
			page = 1;
			hasMore = true;
			performSearch(String(q).trim(), 1, false);
			_timer = null;
		}, 750);
	}

	async function loadMore() {
		if (isSearching || loadingMore || !hasMore) return;
		const next = page + 1;
		await performSearch(appStore.state.searchQuery, next, true);
	}

	function handleScroll(e: Event) {
		const target = e.target as HTMLElement;
		if (!target) return;
		const threshold = 300;
		if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
			loadMore();
		}
	}

	function loadWallpaperForPalette(url: string | undefined) {
		if (!url) return;
		const toastId = toast.loading('Extracting palette...');
		appStore.loadWallhavenImage(url, toastId);
		close();
	}

	function close() {
		if (_timer !== null) {
			clearTimeout(_timer);
			_timer = null;
		}
		isOpen = false;
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 flex items-start justify-center bg-black/80 p-6"
		role="button"
		tabindex="0"
		onclick={close}
		onkeypress={(e) => {
			if (e.key === 'Escape') close();
		}}
	>
		<div
			class="relative w-full max-w-4xl rounded-lg border border-zinc-700 bg-zinc-900"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && close()}
			transition:fly={{ y: -50, duration: 250 }}
		>
			<div class="flex items-center gap-3 border-b border-zinc-600 p-1">
				<label for="modal-search" class="sr-only">Search Wallpapers</label>
				<input
					id="modal-search"
					type="text"
					bind:this={inputEl}
					bind:value={appStore.state.searchQuery}
					oninput={() => {
						scheduleSearch(appStore.state.searchQuery);
					}}
					placeholder="Search Wallpapers"
					class="w-full bg-zinc-900 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-400 focus:outline-none"
				/>
			</div>

			<div class="custom-scrollbar mt-3 max-h-[75vh] overflow-auto p-5" onscroll={handleScroll}>
				{#if isSearching}
					<p class="mb-4 text-sm text-zinc-400">Searching…</p>
					<div class="flex items-center justify-center py-8">
						<div class="border-t-brand h-8 w-8 animate-spin rounded-full border-2 border-zinc-600"></div>
					</div>
				{:else if results.length === 0}
					{#if appStore.state.searchQuery}
						<p class="mb-4 text-sm text-zinc-400">No results for “{appStore.state.searchQuery}”</p>
					{:else}
						<p class="text-sm text-zinc-400">Type to search wallpapers...</p>
					{/if}
				{:else}
					<p class="mb-4 text-sm text-zinc-400">Results for “{appStore.state.searchQuery}”</p>
					<div class="masonry pe-3">
						{#each results as result, idx (result.id + '-' + idx)}
							<div class="masonry-item group relative rounded-sm">
								{#if result.path && result.thumbs && result.thumbs.original}
									<button
										class="h-full w-full cursor-pointer hover:opacity-50"
										onclick={() => loadWallpaperForPalette(result.path)}
										onkeypress={() => loadWallpaperForPalette(result.path)}
									>
										<img src={result.thumbs.original} alt="wallpaper thumb" />
									</button>
								{:else}
									<div class="placeholder aspect-[16/9] w-full bg-gradient-to-br from-zinc-700 to-zinc-900"></div>
								{/if}
							</div>
						{/each}
					</div>

					{#if loadingMore}
						<div class="flex items-center justify-center py-4">
							<div class="border-t-brand h-6 w-6 animate-spin rounded-full border-2 border-zinc-600"></div>
						</div>
					{:else if !hasMore && results.length > 0}
						<p class="mt-4 text-center text-xs text-zinc-500">No more results</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.masonry {
		column-gap: 16px;
		columns: 1;
		margin: 16px auto 0 auto;
	}

	@media (min-width: 1024px) {
		.masonry {
			columns: 2;
		}
	}

	.masonry-item {
		display: inline-block;
		width: 100%;
		height: 100%;
		margin: 0 0 8px 0;
		break-inside: avoid;
		-webkit-column-break-inside: avoid;
		page-break-inside: avoid;
		overflow: hidden;
	}

	.masonry-item img {
		width: 100%;
		height: auto;
		display: block;
		object-fit: contain;
	}

	.masonry-item .placeholder {
		width: 100%;
		height: auto;
	}
</style>
