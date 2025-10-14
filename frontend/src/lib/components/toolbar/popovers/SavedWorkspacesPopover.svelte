<script lang="ts">
	import { cn } from '$lib/utils';
	import { appStore } from '$lib/stores/app.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	async function handleWorkspaceLoad(workspaceId: string) {
		const workspace = appStore.state.savedWorkspaces.find((w) => w.id === workspaceId);
		if (workspace) {
			await appStore.loadWorkspace(workspace);
			popoverStore.close('workspaces');
		}
	}

	async function handleWorkspaceDelete(workspaceId: string, workspaceName: string) {
		if (confirm(`Are you sure you want to delete "${workspaceName}"?`)) {
			await appStore.deleteWorkspace(workspaceId);
		}
	}
</script>

<div
	class={cn(
		'palette-dropdown-base w-80',
		popoverStore.state.direction === 'right' ? 'left-full ml-2' : 'right-full mr-2'
	)}
	style={`min-width: 260px; ${popoverStore.state.direction === 'right' ? 'left: calc(100% + 0.5rem);' : 'right: calc(100% + 0.5rem);'}`}
	role="dialog"
	aria-labelledby="saved-workspaces-title"
	tabindex="-1"
>
	<h3 id="saved-workspaces-title" class="text-brand mb-3 text-xs font-medium">Saved Workspaces</h3>
	<div class="scrollable-content custom-scrollbar max-h-72 overflow-y-auto">
		{#if appStore.state.savedWorkspaces.length === 0}
			<div class="py-8 text-center text-zinc-300">No saved workspaces yet.</div>
		{:else}
			<ul class="flex flex-col gap-4">
				{#each appStore.state.savedWorkspaces as item}
					<li class="flex flex-col gap-2 rounded border border-zinc-600 bg-zinc-800/50 px-2 py-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-brand max-w-[120px] truncate font-mono text-xs" title={item.name}>
								{item.name}
							</span>
							<div class="flex items-center gap-3">
								<button
									class="text-brand hover:text-brand-hover cursor-pointer rounded text-xs font-medium"
									onclick={() => handleWorkspaceLoad(item.id)}
									type="button"
								>
									Load
								</button>
								<button
									class="cursor-pointer rounded text-xs font-medium text-red-400 hover:text-red-300"
									onclick={() => handleWorkspaceDelete(item.id, item.name)}
									type="button"
									title="Delete workspace"
								>
									Delete
								</button>
							</div>
						</div>
						<div class="mt-1 flex flex-row items-center gap-2">
							<img src={item.imageData} alt={item.name} class="h-16 w-16 rounded border border-white/10 object-cover" />
							<div class="flex-1">
								<div class="text-xs text-zinc-400">
									{item.colors?.length || 0} colors
								</div>
								<div class="text-xs text-zinc-400">
									{item.selectors?.length || 0} selections
								</div>
							</div>
						</div>
						<div class="mt-2 text-xs text-zinc-400">
							Created: {new Date(item.createdAt).toLocaleDateString()}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #eeb38f transparent;
		padding: 5px;
	}
</style>
