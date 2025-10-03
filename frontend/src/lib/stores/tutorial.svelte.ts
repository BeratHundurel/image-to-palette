export interface TutorialStep {
	id: string;
	title: string;
	description: string;
	element?: string; // CSS selector for element to highlight
	position: 'top' | 'bottom' | 'left' | 'right' | 'center';
	action?: 'click' | 'drag' | 'upload' | 'wait';
	condition?: () => boolean; // Function to check if step can proceed
	onComplete?: () => void; // Callback when step is completed
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
			'Notice the colored selection tools in the toolbar? Each color represents a different selection area. Try clicking a different color selector!',
		element: '[role="toolbar"] ul li:first-child button',
		position: 'left',
		action: 'click',
		skipable: true
	},
	{
		id: 'extract-colors',
		title: 'Extract Your Palette',
		description:
			'Great! Now you can see the colors extracted from your selections. Click on any color to copy it to your clipboard.',
		element: 'section.w-full.max-w-5xl .grid.min-h-12',
		position: 'top',
		skipable: true
	},
	{
		id: 'save-palette',
		title: 'Save Your Palette',
		description: 'Love your palette? Click the "Save Palette" button to save it for later use!',
		element: 'button[onclick*="savePalette"]',
		position: 'top',
		action: 'click',
		condition: () => tutorialStore.state.hasSavedPalette,
		skipable: true
	},
	{
		id: 'toolbar-features',
		title: 'Explore the Toolbar',
		description:
			'The toolbar contains powerful features for processing and extraction. You can even drag it around! Try clicking the palette icon (🎨) to see your saved palettes.',
		element: '[role="toolbar"]',
		position: 'left',
		skipable: true
	},
	{
		id: 'apply-palette',
		title: 'Apply Saved Palettes',
		description:
			'In the saved palettes popup, you can apply any saved palette to your current image. This is great for maintaining color consistency across projects!',
		element: 'button[aria-label="Show saved palettes"]',
		position: 'left',
		action: 'click',
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
	let state = $state<TutorialState>({
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

	return {
		get state() {
			return {
				...state,
				hasImageUploaded,
				hasSelection,
				hasSavedPalette
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

		setHasSavedPalette(saved: boolean) {
			hasSavedPalette = saved;
		},

		shouldShowTutorial(): boolean {
			const hasCompletedBefore = localStorage.getItem('tutorial-completed') === 'true';
			const hasSkippedBefore = localStorage.getItem('tutorial-skipped') === 'true';
			return !hasCompletedBefore && !hasSkippedBefore;
		}
	};
}

export const tutorialStore = createTutorialStore();
