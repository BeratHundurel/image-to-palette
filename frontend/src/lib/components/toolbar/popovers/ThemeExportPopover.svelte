<script lang="ts">
	import { popoverStore } from '$lib/stores/popovers.svelte';
	import { appStore } from '$lib/stores/app.svelte';
	import { generateVSCodeTheme } from '$lib/vscodeTheme';
	import type { HarmonyScheme } from '$lib/colorUtils';
	import toast from 'svelte-french-toast';
	import { cn } from '$lib/utils';

	type ThemeMode = 'harmony' | 'strict';

	interface ThemeColorWithUsage {
		label: string;
		color: string;
		usages: string[];
	}

	const STORAGE_KEY = 'themeExportPreferences';

	function loadPreferences() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const prefs = JSON.parse(stored);
				return {
					mode: (prefs.mode as ThemeMode) || 'harmony',
					scheme: (prefs.scheme as HarmonyScheme) || 'triadic'
				};
			}
		} catch (error) {
			console.error('Failed to load theme export preferences:', error);
		}
		return { mode: 'harmony' as ThemeMode, scheme: 'triadic' as HarmonyScheme };
	}

	function savePreferences(mode: ThemeMode, scheme: HarmonyScheme) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, scheme }));
		} catch (error) {
			console.error('Failed to save theme export preferences:', error);
		}
	}

	const prefs = loadPreferences();
	let themeMode = $state<ThemeMode>(prefs.mode);
	let harmonyScheme = $state<HarmonyScheme>(prefs.scheme);
	let generatedTheme = $state<string>('');
	let isGenerating = $state(false);
	let showLoading = $state(false);
	let loadingTimer: number | undefined;
	let themeColorsWithUsage = $state<ThemeColorWithUsage[]>([]);
	let expandedColorIndices = $state<number[]>([]);
	let changedColorIndices = $state<Set<number>>(new Set());
	let hasGeneratedTheme = $state(false);
	let isOpen = $derived(popoverStore.isOpen('themeExport'));

	$effect(() => {
		if (isOpen && !hasGeneratedTheme) {
			hasGeneratedTheme = true;
			generateThemeColors();
		} else if (!isOpen) {
			hasGeneratedTheme = false;
		}
	});

	function generateThemeColors() {
		if (!appStore.state.colors || appStore.state.colors.length === 0) return;

		expandedColorIndices = [];
		isGenerating = true;

		// Store previous colors for comparison
		const previousColors = themeColorsWithUsage.map((item) => item.color);

		if (loadingTimer) clearTimeout(loadingTimer);
		loadingTimer = window.setTimeout(() => {
			if (isGenerating) {
				showLoading = true;
			}
		}, 150);

		queueMicrotask(() => {
			try {
				const colorsToUse = appStore.state.colors.map((c) => c.hex);
				const useStrictMode = themeMode === 'strict';

				generatedTheme = generateVSCodeTheme(colorsToUse, useStrictMode, harmonyScheme);

				extractThemeColorsWithUsage();

				highlightChangedColors(previousColors);
			} catch (error) {
				toast.error('Failed to generate theme: ' + (error instanceof Error ? error.message : 'Unknown error'));
			} finally {
				isGenerating = false;
				showLoading = false;
				if (loadingTimer) clearTimeout(loadingTimer);
			}
		});
	}

	function extractThemeColorsWithUsage() {
		try {
			const theme = JSON.parse(generatedTheme);
			const colorToUsages = new Map<string, string[]>();

			// Extract from theme.colors (UI colors)
			const colors = theme.colors || {};
			for (const [key, value] of Object.entries(colors)) {
				if (typeof value !== 'string') continue;

				const color = value.substring(0, 7);
				if (!colorToUsages.has(color)) {
					colorToUsages.set(color, []);
				}
				colorToUsages.get(color)!.push(key);
			}

			// Extract from tokenColors (syntax highlighting)
			const tokenColors = theme.tokenColors || [];
			for (const token of tokenColors) {
				if (!token.settings?.foreground) continue;

				const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
				const color = token.settings.foreground.substring(0, 7);

				if (!colorToUsages.has(color)) {
					colorToUsages.set(color, []);
				}

				for (const scope of scopes) {
					if (scope) colorToUsages.get(color)!.push(scope);
				}
			}

			const colorEntries = Array.from(colorToUsages.entries())
				.sort((a, b) => b[1].length - a[1].length)
				.slice(0, 20);

			themeColorsWithUsage = colorEntries.map(([color, usages]) => {
				const label = getLabelForColor(usages[0]);
				return { label, color, usages };
			});
		} catch (error) {
			console.error('Failed to extract theme colors:', error);
		}
	}

	function highlightChangedColors(previousColors: string[]) {
		if (previousColors.length === 0) {
			return;
		}

		const currentColors = themeColorsWithUsage.map((item) => item.color);
		const changedIndices = new Set<number>();

		currentColors.forEach((color, index) => {
			if (!previousColors.includes(color)) {
				changedIndices.add(index);
			}
		});

		previousColors.forEach((prevColor) => {
			if (!currentColors.includes(prevColor)) {
				const newIndex = currentColors.findIndex((color) => color === prevColor);
				if (newIndex === -1) {
					const prevIndex = previousColors.indexOf(prevColor);
					if (prevIndex < currentColors.length && currentColors[prevIndex] !== prevColor) {
						changedIndices.add(prevIndex);
					}
				}
			}
		});

		changedColorIndices = changedIndices;

		setTimeout(() => {
			changedColorIndices = new Set();
		}, 3000);
	}

	function getLabelForColor(firstUsage: string): string {
		if (firstUsage.includes('background')) return 'Background';
		if (firstUsage.includes('foreground')) return 'Foreground';
		if (firstUsage.includes('cursor') || firstUsage.includes('focusBorder')) return 'Primary Accent';
		if (firstUsage.includes('activeBorder') || firstUsage.includes('selection')) return 'Selection';
		if (firstUsage.includes('Green')) return 'Success';
		if (firstUsage.includes('Red')) return 'Error';
		if (firstUsage.includes('Yellow')) return 'Warning';
		if (firstUsage.includes('Blue')) return 'Info';
		if (firstUsage.includes('sideBar')) return 'Sidebar';
		if (firstUsage.includes('activityBar')) return 'Activity Bar';
		if (firstUsage.includes('statusBar')) return 'Status Bar';
		if (firstUsage.includes('tab')) return 'Tabs';
		if (firstUsage.includes('panel')) return 'Panel';
		if (firstUsage.includes('titleBar')) return 'Title Bar';
		if (firstUsage.includes('input')) return 'Inputs';
		if (firstUsage.includes('button')) return 'Buttons';
		if (firstUsage.includes('badge')) return 'Badges';
		if (firstUsage.includes('list')) return 'Lists';
		return 'UI Element';
	}

	async function exportTheme() {
		try {
			await navigator.clipboard.writeText(generatedTheme);
			toast.success('Theme JSON copied to clipboard!');
			popoverStore.close('themeExport');
		} catch (error) {
			toast.error('Failed to copy theme to clipboard');
		}
	}

	function handleModeChange(mode: ThemeMode) {
		if (isGenerating) return;
		themeMode = mode;
		savePreferences(themeMode, harmonyScheme);
		generateThemeColors();
	}

	function handleHarmonySchemeChange(scheme: HarmonyScheme) {
		if (isGenerating) return;
		harmonyScheme = scheme;
		savePreferences(themeMode, harmonyScheme);
		generateThemeColors();
	}

	function toggleColorUsage(index: number) {
		if (expandedColorIndices.includes(index)) {
			expandedColorIndices = expandedColorIndices.filter((i) => i !== index);
		} else {
			expandedColorIndices = [...expandedColorIndices, index];
		}
	}

	function isExpanded(index: number): boolean {
		return expandedColorIndices.includes(index);
	}
</script>

{#if popoverStore.isOpen('themeExport')}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>

		<!-- Modal -->
		<div
			role="dialog"
			aria-labelledby="theme-inspector-title"
			aria-modal="true"
			class="share-modal-content border-brand/50 shadow-brand/20 relative z-10 flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-zinc-900 shadow-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-700 bg-zinc-800/50 px-6 py-5">
				<div>
					<h2 id="theme-inspector-title" class="text-brand text-2xl font-semibold">VS Code Theme Inspector</h2>
					<p class="mt-1 text-sm text-zinc-400">Review and customize the colors before exporting</p>
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

			<!-- Content -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
				{#if showLoading}
					<div class="flex items-center justify-center py-16">
						<div class="flex flex-col items-center gap-4">
							<div class="border-t-brand h-12 w-12 animate-spin rounded-full border-4 border-zinc-700"></div>
							<p class="text-brand text-base font-medium">Generating theme colors...</p>
						</div>
					</div>
				{:else}
					<!-- Mode Selection -->
					<div class="mb-8">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">Theme Mode</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<button
								type="button"
								onclick={() => handleModeChange('harmony')}
								class="group relative overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-300 {themeMode ===
								'harmony'
									? 'border-brand bg-brand/10 shadow-brand/20 shadow-lg'
									: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-5 w-5 items-center justify-center rounded-full border transition-all {themeMode ===
										'harmony'
											? 'border-brand bg-brand/20'
											: 'border-zinc-500'}"
									>
										{#if themeMode === 'harmony'}
											<div class="bg-brand h-2.5 w-2.5 rounded-full"></div>
										{/if}
									</div>
									<span class="text-sm font-semibold {themeMode === 'harmony' ? 'text-brand' : 'text-zinc-200'}"
										>Harmony</span
									>
									<span class="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
										Recommended
									</span>
								</div>
								<p class="mt-1.5 ml-7 text-xs text-zinc-400">
									Analyzes palette quality and generates additional harmony colors <span
										class="font-semibold text-zinc-300">only when needed</span
									> for better theme coverage
								</p>
							</button>

							<button
								type="button"
								onclick={() => handleModeChange('strict')}
								class="group relative overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-300 {themeMode ===
								'strict'
									? 'border-brand bg-brand/10 shadow-brand/20 shadow-lg'
									: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
							>
								<div class="flex items-center gap-2">
									<div
										class="flex h-5 w-5 items-center justify-center rounded-full border transition-all {themeMode ===
										'strict'
											? 'border-brand bg-brand/20'
											: 'border-zinc-500'}"
									>
										{#if themeMode === 'strict'}
											<div class="bg-brand h-2.5 w-2.5 rounded-full"></div>
										{/if}
									</div>
									<span class="text-sm font-semibold {themeMode === 'strict' ? 'text-brand' : 'text-zinc-200'}"
										>Strict</span
									>
								</div>
								<p class="mt-1.5 ml-7 text-xs text-zinc-400">
									Tries to respect and use your original palette colors without generating additional ones
								</p>
							</button>
						</div>
					</div>

					<!-- Harmony Scheme Selection (only shown in harmony mode) -->
					{#if themeMode === 'harmony'}
						<div class="mb-8">
							<div class="mb-4 flex items-center gap-2">
								<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">Harmony Scheme</h3>
								<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
							</div>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
								<button
									type="button"
									onclick={() => handleHarmonySchemeChange('triadic')}
									class="rounded-lg border px-3 py-2 text-left transition-all {harmonyScheme === 'triadic'
										? 'border-brand bg-brand/10'
										: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
								>
									<div class="flex items-center gap-1.5">
										<div class="text-xs font-semibold {harmonyScheme === 'triadic' ? 'text-brand' : 'text-zinc-200'}">
											Triadic
										</div>
										<span class="rounded-full bg-green-500/20 px-1 py-0.5 text-[10px] font-medium text-green-400">
											Recommended
										</span>
									</div>
									<div class="mt-1 text-xs text-zinc-400">120° apart</div>
								</button>

								<button
									type="button"
									onclick={() => handleHarmonySchemeChange('complementary')}
									class="rounded-lg border px-3 py-2 text-left transition-all {harmonyScheme === 'complementary'
										? 'border-brand bg-brand/10'
										: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
								>
									<div
										class="text-xs font-semibold {harmonyScheme === 'complementary' ? 'text-brand' : 'text-zinc-200'}"
									>
										Complementary
									</div>
									<div class="mt-1 text-xs text-zinc-400">Opposite colors</div>
								</button>

								<button
									type="button"
									onclick={() => handleHarmonySchemeChange('analogous')}
									class="rounded-lg border px-3 py-2 text-left transition-all {harmonyScheme === 'analogous'
										? 'border-brand bg-brand/10'
										: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
								>
									<div class="text-xs font-semibold {harmonyScheme === 'analogous' ? 'text-brand' : 'text-zinc-200'}">
										Analogous
									</div>
									<div class="mt-1 text-xs text-zinc-400">Adjacent colors</div>
								</button>

								<button
									type="button"
									onclick={() => handleHarmonySchemeChange('split-complementary')}
									class="rounded-lg border px-3 py-2 text-left transition-all {harmonyScheme === 'split-complementary'
										? 'border-brand bg-brand/10'
										: 'border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50'}"
								>
									<div
										class="text-xs font-semibold {harmonyScheme === 'split-complementary'
											? 'text-brand'
											: 'text-zinc-200'}"
									>
										Split Comp.
									</div>
									<div class="mt-1 text-xs text-zinc-400">Complement split</div>
								</button>
							</div>
						</div>
					{/if}

					<!-- Theme Colors with Usage -->
					<div class="mb-8">
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">
								Theme Colors ({themeColorsWithUsage.length})
							</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
							<span class="text-xs text-zinc-400">Colors used in VS Code theme JSON</span>
						</div>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
							{#each themeColorsWithUsage as item, index}
								<div
									class={cn(
										'hover:border-brand/50 flex flex-col overflow-hidden rounded-lg border-2 border-zinc-700 bg-zinc-800/50 transition-all duration-500',
										changedColorIndices.has(index) &&
											'border-brand bg-brand/10 shadow-brand/30 ring-brand/50 animate-pulse shadow-xl ring-2'
									)}
								>
									<button
										type="button"
										onclick={() => toggleColorUsage(index)}
										class="flex w-full items-center gap-2 p-2 text-left transition-colors hover:bg-zinc-800"
									>
										<div
											class="h-8 w-8 flex-shrink-0 rounded border border-zinc-600 shadow-sm"
											style="background-color: {item.color};"
										></div>
										<div class="min-w-0 flex-1">
											<div class="text-xs font-semibold text-zinc-200">
												{item.label}
											</div>
											<div class="font-mono text-xs text-zinc-400">
												{item.color}
											</div>
											<div class="mt-1 text-xs text-zinc-500">
												{item.usages.length} usage{item.usages.length !== 1 ? 's' : ''}
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
											<div class="mb-1.5 text-xs font-medium text-zinc-400">Properties:</div>
											<div class="custom-scrollbar max-h-32 space-y-1 overflow-y-auto">
												{#each item.usages as usage}
													<div class="rounded bg-zinc-800/50 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
														{usage}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
					<!-- Theme JSON Preview -->
					<div>
						<div class="mb-4 flex items-center gap-2">
							<h3 class="text-brand text-sm font-semibold tracking-wide uppercase">Theme JSON Preview</h3>
							<div class="from-brand/50 h-px flex-1 bg-gradient-to-r to-transparent"></div>
						</div>
						<div class="rounded-lg border border-zinc-700 bg-zinc-950/50">
							<pre class="custom-scrollbar max-h-72 overflow-auto p-4 font-mono text-xs text-zinc-300"><code
									>{generatedTheme || 'Generating...'}</code
								></pre>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-zinc-700 bg-zinc-800/50 px-6 py-5">
				<div class="flex items-center gap-2 text-sm text-zinc-400">
					{#if themeMode === 'harmony'}
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
						<span>Using <span class="text-brand font-semibold">harmony mode</span> for optimal colors</span>
					{:else}
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
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
						</svg>
						<span>Using <span class="text-brand font-semibold">strict mode</span> with exact colors</span>
					{/if}
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
						disabled={showLoading || !generatedTheme}
						class="bg-brand shadow-brand/20 hover:shadow-brand/40 rounded-lg px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
					>
						Copy Theme JSON
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #eeb38f transparent;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #eeb38f;
		border-radius: 4px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #ffbe9f;
	}
</style>
