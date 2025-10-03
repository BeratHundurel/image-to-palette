<script lang="ts">
	import { tutorialStore } from '$lib/stores/tutorial.svelte';
	import { appStore } from '$lib/stores/app.svelte';
	import { tick } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let highlightElement: HTMLElement | null = $state(null);
	let tooltipElement: HTMLElement | null = $state(null);

	$effect(() => {
		const currentStep = tutorialStore.getCurrentStep();

		if (appStore.state.imageLoaded) {
			tutorialStore.setImageUploaded(true);
		}

		if (appStore.state.selectors.some((s) => s.selection)) {
			tutorialStore.setHasSelection(true);
		}

		if (
			currentStep?.id === 'selection-tools' &&
			appStore.state.activeSelectorId &&
			appStore.state.activeSelectorId !== 'green'
		) {
			tutorialStore.setSelectorClicked(true);
		}
	});

	$effect(() => {
		const currentStep = tutorialStore.getCurrentStep();
		if (currentStep && currentStep.condition && tutorialStore.checkStepCondition()) {
			setTimeout(() => {
				tutorialStore.next();
			}, 1500);
		}
	});

	$effect(() => {
		if (tutorialStore.state.isActive) {
			updateHighlight();
		}
	});
	async function updateHighlight() {
		await tick();
		const currentStep = tutorialStore.getCurrentStep();

		if (currentStep?.element) {
			const element = document.querySelector(currentStep.element) as HTMLElement;
			if (element) {
				highlightElement = element;
				return;
			}
		}

		highlightElement = null;
	}

	function getTooltipPosition(step: any) {
		if (step.position === 'center') {
			return { styles: {}, actualPosition: 'center' };
		}

		if (!highlightElement) return { styles: {}, actualPosition: 'center' };

		const rect = highlightElement.getBoundingClientRect();
		const tooltipRect = tooltipElement?.getBoundingClientRect();
		const tooltipWidth = tooltipRect?.width || 320;
		const tooltipHeight = tooltipRect?.height || 200;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let position = step.position;

		// Auto-adjust position based on viewport constraints
		if (position === 'top' && rect.top - tooltipHeight - 20 < 0) {
			position = rect.left > viewportWidth / 2 ? 'left' : 'right';
		}
		if (position === 'bottom' && rect.bottom + tooltipHeight + 20 > viewportHeight) {
			position = rect.left > viewportWidth / 2 ? 'left' : 'right';
		}
		if (position === 'left' && rect.left - tooltipWidth - 20 < 0) {
			position = 'right';
		}
		if (position === 'right' && rect.right + tooltipWidth + 20 > viewportWidth) {
			position = 'left';
		}

		let styles;
		switch (position) {
			case 'top':
				styles = {
					top: `${Math.max(20, rect.top - tooltipHeight - 20)}px`,
					left: `${Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, rect.left + rect.width / 2 - tooltipWidth / 2))}px`
				};
				break;
			case 'bottom':
				styles = {
					top: `${Math.min(viewportHeight - tooltipHeight - 20, rect.bottom + 20)}px`,
					left: `${Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, rect.left + rect.width / 2 - tooltipWidth / 2))}px`
				};
				break;
			case 'left':
				styles = {
					top: `${Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, rect.top + rect.height / 2 - tooltipHeight / 2))}px`,
					left: `${Math.max(20, rect.left - tooltipWidth - 20)}px`
				};
				break;
			case 'right':
				styles = {
					top: `${Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, rect.top + rect.height / 2 - tooltipHeight / 2))}px`,
					left: `${Math.min(viewportWidth - tooltipWidth - 20, rect.right + 20)}px`
				};
				break;
			default:
				styles = {};
				break;
		}

		return { styles, actualPosition: position };
	}

	function handleNext() {
		tutorialStore.next();
	}

	function handlePrevious() {
		tutorialStore.previous();
	}

	function handleSkip() {
		tutorialStore.skip();
	}

	function handleExit() {
		tutorialStore.exit();
	}

	let currentStep = $derived(tutorialStore.getCurrentStep());
	let isFirstStep = $derived(tutorialStore.state.currentStepIndex === 0);
	let isLastStep = $derived(tutorialStore.state.currentStepIndex === tutorialStore.state.steps.length - 1);
	let tooltipPositionResult = $derived(
		currentStep ? getTooltipPosition(currentStep) : { styles: {}, actualPosition: 'center' }
	);
	let tooltipStyles = $derived(tooltipPositionResult.styles);
	let actualPosition = $derived(tooltipPositionResult.actualPosition);
</script>

{#if tutorialStore.state.isActive}
	<div class="tutorial-overlay" transition:fade={{ duration: 300 }}>
		<div class="tutorial-backdrop"></div>

		{#if highlightElement && currentStep?.element}
			<div
				class="tutorial-highlight"
				style={`
					top: ${highlightElement.getBoundingClientRect().top - 8}px;
					left: ${highlightElement.getBoundingClientRect().left - 8}px;
					width: ${highlightElement.getBoundingClientRect().width + 16}px;
					height: ${highlightElement.getBoundingClientRect().height + 16}px;
				`}
				transition:scale={{ duration: 300 }}
			></div>
		{/if}

		{#if currentStep}
			<div
				bind:this={tooltipElement}
				class="tutorial-tooltip {actualPosition === 'center' ? 'tutorial-tooltip-center' : ''}"
				style={actualPosition === 'center'
					? 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
					: Object.entries(tooltipStyles)
							.map(([key, value]) => `${key}: ${value}`)
							.join('; ')}
				transition:fly={{ y: 20, duration: 300 }}
			>
				<div class="tutorial-content">
					<!-- Progress indicators -->
					<div class="tutorial-progress">
						<div class="tutorial-dots">
							{#each tutorialStore.state.steps as step, index}
								<div
									class="tutorial-dot"
									class:active={index === tutorialStore.state.currentStepIndex}
									class:completed={tutorialStore.state.completedSteps.has(step.id)}
								></div>
							{/each}
						</div>
						<span class="tutorial-counter">
							{tutorialStore.state.currentStepIndex + 1} of {tutorialStore.state.steps.length}
						</span>
					</div>

					<div class="tutorial-body">
						<h3 class="tutorial-title">{currentStep.title}</h3>
						<p class="tutorial-description">{currentStep.description}</p>

						{#if currentStep.action === 'upload'}
							<div class="tutorial-hint">💡 Try uploading a photo with multiple colors for the best results!</div>
						{:else if currentStep.action === 'drag'}
							<div class="tutorial-hint">💡 Click and drag to create a selection rectangle on the image</div>
						{:else if currentStep.action === 'click'}
							<div class="tutorial-hint">💡 Click the highlighted element to continue</div>
						{/if}
					</div>

					<div class="tutorial-actions">
						<div class="tutorial-navigation">
							{#if !isFirstStep}
								<button class="tutorial-btn tutorial-btn-secondary" onclick={handlePrevious}> ← Previous </button>
							{/if}

							{#if currentStep.condition && !tutorialStore.checkStepCondition()}
								<button class="tutorial-btn tutorial-btn-waiting" disabled> Waiting for action... </button>
							{:else if !isLastStep}
								<button class="tutorial-btn tutorial-btn-primary" onclick={handleNext}> Next → </button>
							{:else}
								<button class="tutorial-btn tutorial-btn-primary" onclick={handleNext}> Complete 🎉 </button>
							{/if}
						</div>

						<div class="tutorial-controls">
							{#if currentStep.skipable}
								<button class="tutorial-btn tutorial-btn-ghost" onclick={handleSkip}> Skip </button>
							{/if}

							<button class="tutorial-btn tutorial-btn-ghost" onclick={handleExit}> Exit Tutorial </button>
						</div>
					</div>
				</div>

				{#if currentStep.element && actualPosition !== 'center'}
					<div class="tutorial-arrow tutorial-arrow-{actualPosition}"></div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		pointer-events: none;
	}

	.tutorial-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(2px);
	}

	.tutorial-highlight {
		position: absolute;
		border: 3px solid #eeb38f;
		border-radius: 8px;
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.7),
			0 0 20px rgba(238, 179, 143, 0.5),
			inset 0 0 20px rgba(238, 179, 143, 0.2);
		pointer-events: none;
		z-index: 10001;
	}

	.tutorial-tooltip {
		position: absolute;
		max-width: 360px;
		min-width: 300px;
		pointer-events: auto;
		z-index: 10002;
	}

	.tutorial-content {
		background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%);
		border: 1px solid #3f3f46;
		border-radius: 12px;
		padding: 24px;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.4),
			0 10px 10px -5px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.tutorial-progress {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid #3f3f46;
	}

	.tutorial-dots {
		display: flex;
		gap: 8px;
	}

	.tutorial-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #52525b;
		transition: all 0.3s ease;
	}

	.tutorial-dot.active {
		background: #eeb38f;
		transform: scale(1.2);
		box-shadow: 0 0 8px rgba(238, 179, 143, 0.4);
	}

	.tutorial-dot.completed {
		background: #10b981;
	}

	.tutorial-counter {
		font-size: 12px;
		color: #a1a1aa;
		font-family: monospace;
	}

	.tutorial-body {
		margin-bottom: 24px;
	}

	.tutorial-title {
		font-size: 18px;
		font-weight: 600;
		color: #eeb38f;
		margin: 0 0 8px 0;
	}

	.tutorial-description {
		font-size: 14px;
		color: #d4d4d8;
		line-height: 1.5;
		margin: 0 0 12px 0;
	}

	.tutorial-hint {
		font-size: 12px;
		color: #a1a1aa;
		background: rgba(238, 179, 143, 0.1);
		border: 1px solid rgba(238, 179, 143, 0.2);
		border-radius: 6px;
		padding: 8px 12px;
		margin-top: 8px;
	}

	.tutorial-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.tutorial-navigation {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.tutorial-controls {
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	.tutorial-btn {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		outline: none;
	}

	.tutorial-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.tutorial-btn-primary {
		background: #eeb38f;
		color: #1f1f23;
	}

	.tutorial-btn-primary:hover:not(:disabled) {
		background: #e6a875;
		transform: translateY(-1px);
	}

	.tutorial-btn-secondary {
		background: #3f3f46;
		color: #d4d4d8;
	}

	.tutorial-btn-secondary:hover {
		background: #52525b;
	}

	.tutorial-btn-ghost {
		background: transparent;
		color: #a1a1aa;
		font-size: 12px;
	}

	.tutorial-btn-ghost:hover {
		color: #d4d4d8;
	}

	.tutorial-btn-waiting {
		background: #3f3f46;
		color: #a1a1aa;
		animation: pulse 2s infinite;
	}

	.tutorial-arrow {
		position: absolute;
		width: 0;
		height: 0;
		border: 8px solid transparent;
	}

	.tutorial-arrow-top {
		bottom: -16px;
		left: 50%;
		transform: translateX(-50%);
		border-top-color: #1f1f23;
	}

	.tutorial-arrow-bottom {
		top: -16px;
		left: 50%;
		transform: translateX(-50%);
		border-bottom-color: #1f1f23;
	}

	.tutorial-arrow-left {
		right: -16px;
		top: 50%;
		transform: translateY(-50%);
		border-left-color: #1f1f23;
	}

	.tutorial-arrow-right {
		left: -16px;
		top: 50%;
		transform: translateY(-50%);
		border-right-color: #1f1f23;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@media (max-width: 768px) {
		.tutorial-tooltip:not(.tutorial-tooltip-center) {
			max-width: 90vw;
			min-width: 280px;
			left: 5vw !important;
			right: 5vw !important;
			transform: none !important;
		}

		.tutorial-tooltip-center {
			max-width: 90vw;
			min-width: 280px;
		}

		.tutorial-content {
			padding: 20px;
		}

		.tutorial-navigation {
			flex-direction: column;
		}
	}
</style>
