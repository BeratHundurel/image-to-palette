<script lang="ts">
	import { tutorialStore } from '$lib/stores/tutorial.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';
	import { cn } from '$lib/utils';

	function restartTutorial() {
		popoverStore.close();
		tutorialStore.reset();
		tutorialStore.start();
	}
</script>

<button
	class={cn(
		'flex h-10 w-28 cursor-pointer items-center justify-center gap-2 rounded-md bg-white/10 text-xs text-zinc-300 outline-0 transition-all duration-300',
		'hover:bg-brand/10 hover:border-brand/30 hover:text-brand hover:-translate-y-px active:translate-y-0'
	)}
	onclick={restartTutorial}
	title="Restart the interactive tutorial"
	type="button"
>
	<span class="text-base max-sm:text-sm">🎓</span>
	<span class="font-medium">Tutorial</span>
</button>
