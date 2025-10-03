<script lang="ts">
	import { tutorialStore } from '$lib/stores/tutorial.svelte';
	import { popoverStore } from '$lib/stores/popovers.svelte';

	function restartTutorial() {
		// Close any open popovers
		popoverStore.close();

		// Reset and start tutorial
		tutorialStore.reset();
		tutorialStore.start();
	}
</script>

<button
	class="tutorial-restart-btn"
	onclick={restartTutorial}
	title="Restart the interactive tutorial"
	type="button"
>
	<span class="tutorial-restart-icon">🎓</span>
	<span class="tutorial-restart-text">Tutorial</span>
</button>

<style>
	.tutorial-restart-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: transparent;
		border: 1px solid #3f3f46;
		border-radius: 6px;
		color: #d4d4d8;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
	}

	.tutorial-restart-btn:hover {
		background: rgba(238, 179, 143, 0.1);
		border-color: rgba(238, 179, 143, 0.3);
		color: #eeb38f;
		transform: translateY(-1px);
	}

	.tutorial-restart-btn:active {
		transform: translateY(0);
	}

	.tutorial-restart-icon {
		font-size: 16px;
	}

	.tutorial-restart-text {
		font-weight: 500;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.tutorial-restart-btn {
			padding: 6px 10px;
			font-size: 12px;
		}

		.tutorial-restart-icon {
			font-size: 14px;
		}
	}
</style>
