<script lang="ts">
	import { popoverStore } from '$lib/stores/popovers.svelte';
	import { appStore } from '$lib/stores/app.svelte';
	import { generateTheme, type ThemeType } from '$lib/api/palette';
	import toast from 'svelte-french-toast';
	import { cn } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';

	const STORAGE_KEY = 'themeExportPreferences';

	interface ThemeColorWithUsage {
		baseColor: string;
		label: string;
		variants: Array<{
			color: string;
			usages: string[];
		}>;
		totalUsages: number;
	}

	const prefs = loadPreferences();

	let editorType = $state<ThemeType>(prefs.editorType);
	let generatedTheme = $state<Record<string, unknown> | null>(null);
	let isGenerating = $state(false);
	let themeColorsWithUsage = $state<ThemeColorWithUsage[]>([]);

	let expandedColorIndices = new SvelteSet<number>();

	let isOpen = $derived(popoverStore.isOpen('themeExport'));

	$effect(() => {
		if (isOpen && generatedTheme === null) {
			generateThemeFromApi();
		}
	});

	$effect(() => {
		if (!isOpen) {
			isGenerating = false;
			expandedColorIndices.clear();
			generatedTheme = null;
			themeColorsWithUsage = [];
		}
	});

	function loadPreferences(): { editorType: ThemeType } {
		if (typeof window === 'undefined') return { editorType: 'vscode' };
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				return { editorType: parsed.editorType || 'vscode' };
			}
		} catch {
			// Ignore parse errors
		}
		return { editorType: 'vscode' };
	}

	function savePreferences(editorType: ThemeType) {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ editorType }));
		} catch {
			// Ignore storage errors
		}
	}

	async function generateThemeFromApi() {
		if (isGenerating || !appStore.state.colors || appStore.state.colors.length === 0) {
			return;
		}
		isGenerating = true;

		try {
			const theme = await generateTheme(appStore.state.colors, editorType, 'Generated Theme');
			generatedTheme = theme;
			themeColorsWithUsage = extractThemeColorsWithUsage(theme);
		} catch (err) {
			toast.error('Failed to generate theme: ' + (err instanceof Error ? err.message : 'Unknown error'));
			generatedTheme = null;
			themeColorsWithUsage = [];
		} finally {
			isGenerating = false;
		}
	}

	function extractThemeColorsWithUsage(theme: Record<string, unknown>): ThemeColorWithUsage[] {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- not reactive state, local to function
		const colorMap = new Map<string, Map<string, Set<string>>>();

		function traverse(obj: unknown, prefix: string) {
			if (typeof obj === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/i.test(obj)) {
				const normalizedColor = obj.toUpperCase();
				const baseColor = normalizedColor.substring(0, 7);

				if (!colorMap.has(baseColor)) {
					colorMap.set(baseColor, new Map());
				}
				if (!colorMap.get(baseColor)!.has(normalizedColor)) {
					colorMap.get(baseColor)!.set(normalizedColor, new Set());
				}
				colorMap.get(baseColor)!.get(normalizedColor)!.add(prefix);
			} else if (typeof obj === 'object' && obj !== null) {
				if (Array.isArray(obj)) {
					obj.forEach((item, index) => traverse(item, `${prefix}[${index}]`));
				} else {
					for (const [key, value] of Object.entries(obj)) {
						traverse(value, prefix ? `${prefix}.${key}` : key);
					}
				}
			}
		}

		traverse(theme, '');

		const result: ThemeColorWithUsage[] = [];
		colorMap.forEach((variants, baseColor) => {
			const variantArray = Array.from(variants.entries())
				.map(([color, usages]) => ({
					color,
					usages: Array.from(usages).sort()
				}))
				.sort((a, b) => b.usages.length - a.usages.length);

			const totalUsages = variantArray.reduce((sum, v) => sum + v.usages.length, 0);

			result.push({
				baseColor,
				label: baseColor,
				variants: variantArray,
				totalUsages
			});
		});

		return result.sort((a, b) => b.totalUsages - a.totalUsages);
	}

	async function handleEditorTypeChange(type: ThemeType) {
		if (editorType === type) return;
		editorType = type;
		savePreferences(editorType);
		generatedTheme = null;
		themeColorsWithUsage = [];
		await generateThemeFromApi();
	}

	async function exportTheme() {
		if (!generatedTheme) return;

		try {
			const themeJson = JSON.stringify(generatedTheme, null, 2);
			await navigator.clipboard.writeText(themeJson);
			toast.success('Theme JSON copied to clipboard!');
			popoverStore.close('themeExport');
		} catch {
			toast.error('Failed to copy theme to clipboard');
		}
	}

	function toggleColorUsage(index: number) {
		if (expandedColorIndices.has(index)) {
			expandedColorIndices.delete(index);
		} else {
			expandedColorIndices.add(index);
		}
	}

	function isExpanded(index: number): boolean {
		return expandedColorIndices.has(index);
	}
</script>

{#if popoverStore.isOpen('themeExport')}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>

		<div
			role="dialog"
			aria-labelledby="theme-inspector-title"
			aria-modal="true"
			class="share-modal-content border-brand/50 shadow-brand/20 relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-zinc-900 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-zinc-700 bg-zinc-800/50 px-6 py-5">
				<div>
					<h2 id="theme-inspector-title" class="text-brand text-2xl font-semibold">
						{editorType === 'vscode' ? 'VS Code' : 'Zed'} Theme Inspector
					</h2>
					<p class="mt-1 text-sm text-zinc-400">Review the generated theme colors before exporting</p>
				</div>
				<button
					type="button"
					onclick={() => popoverStore.close('themeExport')}
					class="hover:text-brand rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800"
					aria-label="Close"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
				{#if isGenerating}
					<div class="flex items-center justify-center py-16">
						<div class="flex flex-col items-center gap-4">
							<div class="border-t-brand h-12 w-12 animate-spin rounded-full border-4 border-zinc-700"></div>
							<p class="text-brand text-base font-medium">Generating theme...</p>
						</div>
					</div>
				{:else}
					<div class="mb-8">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">Editor Type</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<button
								type="button"
								onclick={() => handleEditorTypeChange('vscode')}
								class="group relative overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-300 {editorType ===
								'vscode'
									? 'border-brand bg-brand/10 shadow-brand/20 shadow-lg'
									: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-5 w-5 items-center justify-center rounded-full border transition-all {editorType ===
										'vscode'
											? 'border-brand bg-brand/20'
											: 'border-zinc-500'}"
									>
										{#if editorType === 'vscode'}
											<div class="bg-brand h-2.5 w-2.5 rounded-full"></div>
										{/if}
									</div>
									<span class="text-sm font-semibold {editorType === 'vscode' ? 'text-brand' : 'text-zinc-200'}"
										>VS Code</span
									>
								</div>
								<p class="mt-1.5 ml-7 text-xs text-zinc-400">Generate theme for Visual Studio Code</p>
							</button>

							<button
								type="button"
								onclick={() => handleEditorTypeChange('zed')}
								class="group relative overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-300 {editorType ===
								'zed'
									? 'border-brand bg-brand/10 shadow-brand/20 shadow-lg'
									: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-5 w-5 items-center justify-center rounded-full border transition-all {editorType ===
										'zed'
											? 'border-brand bg-brand/20'
											: 'border-zinc-500'}"
									>
										{#if editorType === 'zed'}
											<div class="bg-brand h-2.5 w-2.5 rounded-full"></div>
										{/if}
									</div>
									<span class="text-sm font-semibold {editorType === 'zed' ? 'text-brand' : 'text-zinc-200'}">Zed</span>
								</div>
								<p class="mt-1.5 ml-7 text-xs text-zinc-400">Generate theme for Zed editor</p>
							</button>
						</div>
					</div>

					<div class="mb-8">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">
								Theme Colors ({themeColorsWithUsage.length})
							</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
							<span class="text-xs text-zinc-400"
								>Colors used in {editorType === 'vscode' ? 'VS Code' : 'Zed'} theme</span
							>
						</div>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
							{#each themeColorsWithUsage as item, index (index)}
								<div
									class={cn(
										'hover:border-brand/50 flex flex-col overflow-hidden rounded-lg border-2 border-zinc-700 bg-zinc-800/50 transition-all duration-500'
									)}
								>
									<button
										type="button"
										onclick={() => toggleColorUsage(index)}
										class="flex w-full items-center gap-2 p-2 text-left transition-colors hover:bg-zinc-800"
									>
										<div
											class="h-8 w-8 flex-shrink-0 rounded border border-zinc-600 shadow-sm"
											style="background-color: {item.baseColor};"
										></div>
										<div class="min-w-0 flex-1">
											<div class="font-mono text-xs font-semibold text-zinc-200">
												{item.baseColor}
											</div>
											<div class="mt-0.5 text-xs text-zinc-500">
												{item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
											</div>
											<div class="text-xs text-zinc-500">
												{item.totalUsages} usage{item.totalUsages !== 1 ? 's' : ''}
											</div>
										</div>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											class="flex-shrink-0 text-zinc-500 transition-transform {isExpanded(index) ? 'rotate-180' : ''}"
										>
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</button>
									{#if isExpanded(index)}
										<div class="border-t border-zinc-700 bg-zinc-900/50 p-2">
											<div class="space-y-2">
												{#each item.variants as variant, variantIndex (variantIndex)}
													<div class="rounded-lg border border-zinc-700 bg-zinc-800/50 p-2">
														<div class="mb-1.5 flex items-center gap-2">
															<div
																class="h-6 w-6 shrink-0 rounded border border-zinc-600"
																style="background-color: {variant.color}"
															></div>
															<div class="min-w-0 flex-1">
																<div class="font-mono text-xs font-medium text-zinc-300">
																	{variant.color}
																</div>
																<div class="text-xs text-zinc-500">
																	{variant.usages.length} usage{variant.usages.length !== 1 ? 's' : ''}
																</div>
															</div>
														</div>
														<div class="custom-scrollbar max-h-24 space-y-1 overflow-y-auto pl-8">
															{#each variant.usages as usage, usageIndex (usageIndex)}
																<div class="rounded bg-zinc-900/50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
																	{usage}
																</div>
															{/each}
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<div>
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">Theme JSON Preview</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="rounded-lg border border-zinc-700 bg-zinc-950/50">
							<pre class="custom-scrollbar max-h-72 overflow-auto p-4 font-mono text-xs text-zinc-300">
								<code>{generatedTheme ? JSON.stringify(generatedTheme, null, 2) : ''}</code>
							</pre>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-between border-t border-zinc-700 bg-zinc-800/50 px-6 py-5">
				<div class="flex items-center gap-2 text-sm text-zinc-400">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-brand"
					>
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22 4 12 14.01 9 11.01" />
					</svg>
					<span
						>Theme generated from <span class="text-brand font-semibold">{appStore.state.colors.length}</span> palette colors</span
					>
				</div>
				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => popoverStore.close('themeExport')}
						class="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={exportTheme}
						disabled={isGenerating || !generatedTheme}
						class="bg-brand shadow-brand/20 hover:shadow-brand/40 rounded-lg px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
					>
						Copy Theme JSON
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
