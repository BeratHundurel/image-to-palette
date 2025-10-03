<script lang="ts">
	import { tutorialStore } from '$lib/stores/tutorial.svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let showPrompt = $state(false);

	onMount(() => {
		if (tutorialStore.shouldShowTutorial() && !tutorialStore.state.isActive) {
			showPrompt = true;
		}
	});

	$effect(() => {
		if (tutorialStore.state.isActive && showPrompt) {
			showPrompt = false;
		}
	});

	function startTutorial() {
		showPrompt = false;
		setTimeout(() => {
			tutorialStore.start();
		}, 300);
	}

	function dismissPrompt() {
		showPrompt = false;
		localStorage.setItem('tutorial-skipped', 'true');
	}
</script>

{#if showPrompt}
	<div class="tutorial-start-overlay" transition:fade={{ duration: 300 }}>
		<div
			class="tutorial-start-backdrop"
			onclick={dismissPrompt}
			onkeydown={(e) => e.key === 'Escape' && dismissPrompt()}
			role="button"
			tabindex="0"
			aria-label="Close tutorial prompt"
		></div>
		<div class="tutorial-start-modal custom-scrollbar-lg" transition:fly={{ y: 30, duration: 400 }}>
			<div class="tutorial-start-content">
				<div class="max-h-[90vh] overflow-y-auto px-4">
					<div class="tutorial-start-header">
						<div class="tutorial-start-icon">🎨</div>
						<h2 class="tutorial-start-title">Welcome to Image to Palette!</h2>
						<p class="tutorial-start-subtitle">Extract beautiful color palettes from any image</p>
					</div>

					<div class="tutorial-start-features">
						<div class="feature-item">
							<div class="feature-icon">📸</div>
							<div class="feature-text">
								<strong>Upload Images</strong>
								<span>Drag & drop or click to upload</span>
							</div>
						</div>

						<div class="feature-item">
							<div class="feature-icon">🎯</div>
							<div class="feature-text">
								<strong>Select Areas</strong>
								<span>Choose specific regions for color extraction</span>
							</div>
						</div>

						<div class="feature-item">
							<div class="feature-icon">🎨</div>
							<div class="feature-text">
								<strong>Extract Colors</strong>
								<span>Get perfect palettes instantly</span>
							</div>
						</div>

						<div class="feature-item">
							<div class="feature-icon">💾</div>
							<div class="feature-text">
								<strong>Save & Apply</strong>
								<span>Save palettes and apply to new images</span>
							</div>
						</div>
					</div>

					<div class="tutorial-start-actions">
						<button class="tutorial-start-btn tutorial-start-btn-primary" onclick={startTutorial}>
							<span>Take the Tour</span>
							<span class="tutorial-duration">(2 min)</span>
						</button>

						<button class="tutorial-start-btn tutorial-start-btn-secondary" onclick={dismissPrompt}>
							Skip for now
						</button>
					</div>

					<div class="tutorial-start-footer">
						<p>You can always restart the tutorial from the settings menu</p>
					</div>
				</div>
			</div>

			<button class="tutorial-start-close" onclick={dismissPrompt} aria-label="Close tutorial prompt">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.tutorial-start-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9998;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.tutorial-start-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(3px);
		cursor: pointer;
	}

	.tutorial-start-modal {
		position: relative;
		max-width: 480px;
		width: 100%;
	}

	.tutorial-start-content {
		background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%);
		border: 1px solid #3f3f46;
		border-radius: 16px;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		padding: 20px;
	}

	.tutorial-start-close {
		position: absolute;
		top: 16px;
		right: 46px;
		width: 32px;
		height: 32px;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: #a1a1aa;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.tutorial-start-close:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #d4d4d8;
	}

	.tutorial-start-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.tutorial-start-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.tutorial-start-title {
		font-size: 24px;
		font-weight: 700;
		color: #eeb38f;
		margin: 0 0 8px 0;
		line-height: 1.2;
	}

	.tutorial-start-subtitle {
		font-size: 16px;
		color: #a1a1aa;
		margin: 0;
		line-height: 1.4;
	}

	.tutorial-start-features {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 32px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.feature-item:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(238, 179, 143, 0.2);
		transform: translateY(-1px);
	}

	.feature-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.feature-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.feature-text strong {
		font-size: 14px;
		font-weight: 600;
		color: #d4d4d8;
	}

	.feature-text span {
		font-size: 13px;
		color: #a1a1aa;
		line-height: 1.3;
	}

	.tutorial-start-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
	}

	.tutorial-start-btn {
		padding: 14px 24px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		outline: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.tutorial-start-btn-primary {
		background: linear-gradient(135deg, #eeb38f 0%, #d09e87 100%);
		color: #1f1f23;
		box-shadow: 0 4px 12px rgba(238, 179, 143, 0.3);
	}

	.tutorial-start-btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(238, 179, 143, 0.4);
	}

	.tutorial-start-btn-secondary {
		background: transparent;
		color: #a1a1aa;
		border: 1px solid #3f3f46;
	}

	.tutorial-start-btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #d4d4d8;
		border-color: #52525b;
	}

	.tutorial-duration {
		font-size: 13px;
		opacity: 0.8;
		font-weight: 400;
	}

	.tutorial-start-footer {
		text-align: center;
		padding-top: 16px;
		border-top: 1px solid #3f3f46;
	}

	.tutorial-start-footer p {
		font-size: 12px;
		color: #71717a;
		margin: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.tutorial-start-modal {
			max-width: 95vw;
			margin: 0 10px;
		}

		.tutorial-start-content {
			padding: 24px;
		}

		.tutorial-start-title {
			font-size: 20px;
		}

		.tutorial-start-icon {
			font-size: 40px;
		}

		.feature-item {
			padding: 12px;
			gap: 12px;
		}

		.feature-icon {
			font-size: 20px;
		}
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feature-item {
		animation: slideIn 0.3s ease forwards;
	}

	.feature-item:nth-child(1) {
		animation-delay: 0.1s;
	}
	.feature-item:nth-child(2) {
		animation-delay: 0.2s;
	}
	.feature-item:nth-child(3) {
		animation-delay: 0.3s;
	}
	.feature-item:nth-child(4) {
		animation-delay: 0.4s;
	}
</style>
