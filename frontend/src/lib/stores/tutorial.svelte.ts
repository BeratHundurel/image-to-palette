export interface TutorialStep {
	id: string;
	title: string;
	description: string;
	element?: string;
	position: 'top' | 'bottom' | 'left' | 'right' | 'center';
	action?: 'click' | 'drag' | 'upload' | 'wait';
	condition?: () => boolean;
	onComplete?: () => void;
	skipable?: boolean;
}

interface TutorialState {
	isActive: boolean;
	currentStepIndex: number;
	steps: TutorialStep[];
	completedSteps: Set<string>;
	isCompleted: boolean;
	hasStarted: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: 'welcome',
		title: 'Welcome to Image to Palette! 🎨',
		description: "Let's take a quick tour of the features. You can skip this tutorial at any time.",
		position: 'center',
		skipable: true
	},
	{
		id: 'upload-image',
		title: 'Upload Your First Image',
		description:
			'Click the upload area or drag and drop an image to get started. Try uploading a colorful image for the best results!',
		element: 'button[aria-label="Upload an image or drag and drop it here"]',
		position: 'bottom',
		action: 'upload',
		condition: () => tutorialStore.state.hasImageUploaded,
		skipable: true
	},
	{
		id: 'canvas-interaction',
		title: 'Select Areas of Interest',
		description:
			'Click and drag on the image to select areas you want to extract colors from. You can make multiple selections!',
		element: 'canvas',
		position: 'top',
		action: 'drag',
		condition: () => tutorialStore.state.hasSelection,
		skipable: true
	},
	{
		id: 'selection-tools',
		title: 'Use Different Selection Tools',
		description:
			'Notice the colored selection tools in the toolbar? Each color represents a different selection area. Click the red selector and make a selection similar to the previous step!',
		element: '[role="toolbar"] button[aria-label="Selector 2"]',
		position: 'left',
		action: 'drag',
		condition: () => tutorialStore.state.hasSelectorClicked,
		skipable: true
	},
	{
		id: 'extract-colors',
		title: 'Copy Colors from Your Palette',
		description:
			'Perfect! Your palette has been extracted. Now click on any color below to copy its hex code to your clipboard.',
		element: 'section.w-full.max-w-5xl .grid.min-h-12',
		position: 'top',
		condition: () => tutorialStore.state.hasColorCopied,
		skipable: true
	},
	{
		id: 'save-palette',
		title: 'Save Your Current Palette',
		description:
			'Love this palette you just created? Click the "Save Palette" button below to save it for future projects!',
		element: '#save-palette',
		position: 'top',
		action: 'click',
		condition: () => tutorialStore.state.hasCurrentPaletteSaved,
		skipable: true
	},
	{
		id: 'toolbar-features',
		title: 'Explore the Toolbar',
		description:
			'The toolbar contains powerful features for processing and extraction. You can even drag it around! Try clicking the palette icon (🎨) to see your saved palettes.',
		element: 'button[aria-label="Show saved palettes"]',
		position: 'left',
		action: 'click',
		condition: () => tutorialStore.state.hasSavedPalettesPopoverOpen,
		skipable: true
	},
	{
		id: 'apply-palette',
		title: 'Apply Saved Palettes',
		description:
			'In the saved palettes popup, you can apply any saved palette to your current image. This is great for maintaining color consistency across projects!',
		element: '.palette-dropdown-base',
		position: 'left',
		condition: () => tutorialStore.state.hasSavedPaletteApplied,
		skipable: true
	},
	{
		id: 'completion',
		title: 'Tutorial Complete! 🎉',
		description:
			"You're all set! Feel free to explore more features like copying options, palette settings, and application settings. Happy color hunting!",
		position: 'center',
		skipable: false
	}
];

function createTutorialStore() {
	const state = $state<TutorialState>({
		isActive: false,
		currentStepIndex: 0,
		steps: TUTORIAL_STEPS,
		completedSteps: new Set(),
		isCompleted: false,
		hasStarted: false
	});

	let hasImageUploaded = $state(false);
	let hasSelection = $state(false);
	let hasSavedPalette = $state(false);
	let hasSelectorClicked = $state(false);
	let hasColorCopied = $state(false);
	let hasCurrentPaletteSaved = $state(false);
	let hasSavedPalettesPopoverOpen = $state(false);
	let hasSavedPaletteApplied = $state(false);

	return {
		get state() {
			return {
				...state,
				hasImageUploaded,
				hasSelection,
				hasSavedPalette,
				hasSelectorClicked,
				hasColorCopied,
				hasCurrentPaletteSaved,
				hasSavedPalettesPopoverOpen,
				hasSavedPaletteApplied
			};
		},

		start() {
			const hasCompletedBefore = localStorage.getItem('tutorial-completed') === 'true';
			const hasSkippedBefore = localStorage.getItem('tutorial-skipped') === 'true';
			if (hasCompletedBefore || hasSkippedBefore) {
				return;
			}

			state.isActive = true;
			state.hasStarted = true;
			state.currentStepIndex = 0;
			state.completedSteps.clear();

			hasSelectorClicked = false;
			hasColorCopied = false;
			hasCurrentPaletteSaved = false;
			hasSavedPalettesPopoverOpen = false;
			hasSavedPaletteApplied = false;
		},

		next() {
			if (state.currentStepIndex < state.steps.length - 1) {
				const currentStep = state.steps[state.currentStepIndex];
				state.completedSteps.add(currentStep.id);

				if (currentStep.onComplete) {
					currentStep.onComplete();
				}

				state.currentStepIndex++;
			} else {
				this.complete();
			}
		},

		previous() {
			if (state.currentStepIndex > 0) {
				state.currentStepIndex--;
			}
		},

		skip() {
			const currentStep = this.getCurrentStep();
			if (currentStep?.skipable) {
				this.next();
			}
		},

		complete() {
			state.isActive = false;
			state.isCompleted = true;
			localStorage.setItem('tutorial-completed', 'true');
		},

		exit() {
			state.isActive = false;
			localStorage.setItem('tutorial-skipped', 'true');
		},

		reset() {
			state.isActive = false;
			state.currentStepIndex = 0;
			state.completedSteps.clear();
			state.isCompleted = false;
			state.hasStarted = false;

			hasImageUploaded = false;
			hasSelection = false;
			hasSavedPalette = false;
			hasSelectorClicked = false;
			hasColorCopied = false;
			hasCurrentPaletteSaved = false;
			hasSavedPalettesPopoverOpen = false;
			hasSavedPaletteApplied = false;

			localStorage.removeItem('tutorial-completed');
			localStorage.removeItem('tutorial-skipped');
		},

		getCurrentStep(): TutorialStep | null {
			return state.steps[state.currentStepIndex] || null;
		},

		goToStep(stepId: string) {
			const stepIndex = state.steps.findIndex((step) => step.id === stepId);
			if (stepIndex !== -1) {
				state.currentStepIndex = stepIndex;
			}
		},

		checkStepCondition(): boolean {
			const currentStep = this.getCurrentStep();
			if (!currentStep || !currentStep.condition) {
				return true;
			}
			return currentStep.condition();
		},

		setImageUploaded(uploaded: boolean) {
			hasImageUploaded = uploaded;
		},

		setHasSelection(selection: boolean) {
			hasSelection = selection;
		},

		setSelectorClicked(clicked: boolean) {
			const currentStep = this.getCurrentStep();
			if (currentStep?.id === 'selection-tools') {
				hasSelectorClicked = clicked;
			}
		},

		setColorCopied(copied: boolean) {
			const currentStep = this.getCurrentStep();
			if (currentStep?.id === 'extract-colors') {
				hasColorCopied = copied;
			}
		},

		setHasSavedPalette(saved: boolean) {
			hasSavedPalette = saved;
		},

		setCurrentPaletteSaved(saved: boolean) {
			const currentStep = this.getCurrentStep();
			if (currentStep?.id === 'save-palette') {
				hasCurrentPaletteSaved = saved;
			}
		},

		setSavedPalettesPopoverOpen(open: boolean) {
			const currentStep = this.getCurrentStep();
			if (currentStep?.id === 'toolbar-features') {
				hasSavedPalettesPopoverOpen = open;
			}
		},

		setSavedPaletteApplied(applied: boolean) {
			const currentStep = this.getCurrentStep();
			if (currentStep?.id === 'apply-palette') {
				hasSavedPaletteApplied = applied;
			}
		},

		shouldShowTutorial(): boolean {
			const hasCompletedBefore = localStorage.getItem('tutorial-completed') === 'true';
			const hasSkippedBefore = localStorage.getItem('tutorial-skipped') === 'true';
			return !hasCompletedBefore && !hasSkippedBefore;
		}
	};
}

export const tutorialStore = createTutorialStore();
