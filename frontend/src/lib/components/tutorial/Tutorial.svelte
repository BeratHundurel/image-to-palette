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
	<div
		class="tutorial-overlay pointer-events-none fixed top-0 right-0 bottom-0 left-0 z-[9999]"
		transition:fade={{ duration: 300 }}
	>
		<div class="tutorial-backdrop absolute top-0 right-0 bottom-0 left-0 backdrop-blur-xs"></div>

		{#if highlightElement && currentStep?.element}
			<div
				class="tutorial-highlight border-brand pointer-events-none absolute z-[10001] rounded-lg border-[3px]"
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
				class="tutorial-tooltip pointer-events-none absolute z-[10002] {actualPosition === 'center'
					? 'tutorial-tooltip-center'
					: ''}"
				style={actualPosition === 'center'
					? 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
					: Object.entries(tooltipStyles)
							.map(([key, value]) => `${key}: ${value}`)
							.join('; ')}
				transition:fly={{ y: 20, duration: 300 }}
			>
				<div class="tutorial-content border-[#3f3f46 rounded-xl] border-[1px] p-6">
					<!-- Progress indicators -->
					<div class="tutorial-progress mb-4 flex items-center justify-between border-b border-[#3f3f46] pb-4">
						<div class="tutorial-dots flex gap-2">
							{#each tutorialStore.state.steps as step, index}
								<div
									class="tutorial-dot h-2 w-2 rounded-full bg-gray-500 transition-all duration-300 ease-in-out"
									class:active={index === tutorialStore.state.currentStepIndex}
									class:completed={tutorialStore.state.completedSteps.has(step.id)}
								></div>
							{/each}
						</div>
						<span class="tutorial-counter font-mono text-xs text-gray-400">
							{tutorialStore.state.currentStepIndex + 1} of {tutorialStore.state.steps.length}
						</span>
					</div>

					<div class="tutorial-body mb-6">
						<h3 class="tutorial-title text-brand text-lg font-semibold">{currentStep.title}</h3>
						<p class="tutorial-description text-sm">{currentStep.description}</p>

						{#if currentStep.action === 'upload'}
							<div class="tutorial-hint mt-2 border-[6px] px-3 py-2 text-xs">
								💡 Try uploading a photo with multiple colors for the best results!
							</div>
						{:else if currentStep.action === 'drag'}
							<div class="tutorial-hint mt-2 border-[6px] px-3 py-2 text-xs">
								💡 Click and drag to create a selection rectangle on the image
							</div>
						{:else if currentStep.action === 'click'}
							<div class="tutorial-hint mt-2 border-[6px] px-3 py-2 text-xs">
								💡 Click the highlighted element to continue
							</div>
						{/if}
					</div>

					<div class="tutorial-actions flex flex-col gap-3">
						<div class="tutorial-navigation flex justify-between gap-3">
							{#if !isFirstStep}
								<button
									class="tutorial-btn tutorial-btn-ghost tutorial-btn-secondary cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
									onclick={handlePrevious}
								>
									← Previous
								</button>
							{/if}

							{#if currentStep.condition && !tutorialStore.checkStepCondition()}
								<button
									class="tutorial-btn tutorial-btn-ghost tutorial-btn-waiting cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
									disabled
								>
									Waiting for action...
								</button>
							{:else if !isLastStep}
								<button
									class="tutorial-btn tutorial-btn-ghost tutorial-btn-primary cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
									onclick={handleNext}
								>
									Next →
								</button>
							{:else}
								<button
									class="tutorial-btn tutorial-btn-ghost tutorial-btn-primary cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
									onclick={handleNext}
								>
									Complete 🎉
								</button>
							{/if}
						</div>

						<div class="tutorial-controls flex justify-center gap-3">
							{#if currentStep.skipable}
								<button
									class="tutorial-btn tutorial-btn-ghost cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
									onclick={handleSkip}
								>
									Skip
								</button>
							{/if}

							<button
								class="tutorial-btn tutorial-btn-ghost tutorial-btn-ghost cursor-pointer border-[6px] border-none px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none"
								onclick={handleExit}
							>
								Exit Tutorial
							</button>
						</div>
					</div>
				</div>

				{#if currentStep.element && actualPosition !== 'center'}
					<div
						class="tutorial-arrow absolute h-0 w-0 border-[8px] border-transparent tutorial-arrow-{actualPosition}"
					></div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.tutorial-backdrop {
		background: rgba(0, 0, 0, 0.4);
	}

	.tutorial-highlight {
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.7),
			0 0 20px rgba(238, 179, 143, 0.5),
			inset 0 0 20px rgba(238, 179, 143, 0.2);
	}

	.tutorial-tooltip {
		max-width: 360px;
		min-width: 300px;
	}

	.tutorial-content {
		background: linear-gradient(135deg, #1f1f23 0%, #27272a 100%);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.4),
			0 10px 10px -5px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.tutorial-dot.active {
		background: #eeb38f;
		transform: scale(1.2);
		box-shadow: 0 0 8px rgba(238, 179, 143, 0.4);
	}

	.tutorial-dot.completed {
		background: #10b981;
	}

	.tutorial-title {
		margin: 0 0 8px 0;
	}

	.tutorial-description {
		color: #d4d4d8;
		line-height: 1.5;
		margin: 0 0 12px 0;
	}

	.tutorial-hint {
		color: #a1a1aa;
		background: rgba(238, 179, 143, 0.1);
		border: 1px solid rgba(238, 179, 143, 0.2);
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
</style>
