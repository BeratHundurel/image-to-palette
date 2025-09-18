export type PopoverName = 'palette' | 'saved' | 'copy' | 'application';
export type Direction = 'left' | 'right';

export interface PopoverState {
	current: PopoverName | null;
	direction: Direction;
}

const state = $state<PopoverState>({
	current: null,
	direction: 'right'
});

let clickOutsideHandler: ((e: Event) => void) | null = null;

function computeDirection(anchor?: HTMLElement | EventTarget | null): Direction {
	if (typeof window === 'undefined' || !anchor) return 'right';
	const el = anchor as HTMLElement;
	const rect = el.getBoundingClientRect?.();
	if (!rect) return 'right';

	const spaceLeft = rect.left;
	const spaceRight = window.innerWidth - rect.right;

	// Add some padding to ensure popover doesn't go off screen
	const popoverWidth = 320; // Approximate max width of popovers
	return spaceRight >= popoverWidth ? 'right' : 'left';
}

function anchorFromEvent(e?: MouseEvent | Event | null): HTMLElement | null {
	const target = (e as MouseEvent | null)?.currentTarget as HTMLElement | null;
	return target ?? null;
}

function setupClickOutside() {
	if (typeof window === 'undefined') return;

	// Remove existing handler
	if (clickOutsideHandler) {
		document.removeEventListener('click', clickOutsideHandler, true);
		clickOutsideHandler = null;
	}

	// Add new handler if we have an open popover
	if (state.current) {
		clickOutsideHandler = (e: Event) => {
			const target = e.target as HTMLElement;

			// Check if click is inside any popover or trigger button
			const isInsidePopover = target.closest('.palette-dropdown-base');
			const isInsideButton = target.closest('.palette-button-base');

			if (!isInsidePopover && !isInsideButton) {
				state.current = null;
			}
		};

		// Use capture phase and small delay to avoid conflicts with button clicks
		setTimeout(() => {
			if (clickOutsideHandler) {
				document.addEventListener('click', clickOutsideHandler, true);
			}
		}, 10);
	}
}

function cleanup() {
	if (clickOutsideHandler) {
		document.removeEventListener('click', clickOutsideHandler, true);
		clickOutsideHandler = null;
	}
}

export function getPopoverState(): PopoverState {
	return state;
}

export const popoverState = {
	get current() {
		return state.current;
	},
	get direction() {
		return state.direction;
	}
};

export const popovers = {
	open(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		// Close any existing popover first
		if (state.current && state.current !== name) {
			state.current = null;
		}

		state.current = name;
		state.direction = computeDirection(anchor);
		setupClickOutside();
	},

	openFromEvent(name: PopoverName, e: MouseEvent) {
		e.stopPropagation(); // Prevent immediate click-outside trigger
		this.open(name, anchorFromEvent(e));
	},

	toggle(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		if (state.current === name) {
			state.current = null;
			cleanup();
		} else {
			this.open(name, anchor);
		}
	},

	toggleFromEvent(name: PopoverName, e: MouseEvent) {
		e.stopPropagation(); // Prevent immediate click-outside trigger
		this.toggle(name, anchorFromEvent(e));
	},

	close(name?: PopoverName) {
		if (!name || state.current === name) {
			state.current = null;
			cleanup();
		}
	},

	isOpen(name: PopoverName) {
		return state.current === name;
	},

	getDirection(): Direction {
		return state.direction;
	}
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', cleanup);
}
