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

	const spaceRight = window.innerWidth - rect.right;
	const popoverWidth = 320;

	return spaceRight >= popoverWidth ? 'right' : 'left';
}

function setupClickOutside() {
	if (typeof window === 'undefined' || !state.current) return;

	cleanup();

	clickOutsideHandler = (e: Event) => {
		const target = e.target as HTMLElement;
		const isInsidePopover = target.closest('.palette-dropdown-base');
		const isInsideButton = target.closest('.palette-button-base');

		if (!isInsidePopover && !isInsideButton) {
			state.current = null;
		}
	};

	setTimeout(() => {
		if (clickOutsideHandler) {
			document.addEventListener('click', clickOutsideHandler, true);
		}
	}, 10);
}

function cleanup() {
	if (clickOutsideHandler) {
		document.removeEventListener('click', clickOutsideHandler, true);
		clickOutsideHandler = null;
	}
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
	toggle(name: PopoverName, e: MouseEvent) {
		e.stopPropagation();

		if (state.current === name) {
			state.current = null;
			cleanup();
		} else {
			state.current = name;
			state.direction = computeDirection(e.currentTarget);
			setupClickOutside();
		}
	},

	close(name?: PopoverName) {
		if (!name || state.current === name) {
			state.current = null;
			cleanup();
		}
	},

	isOpen(name: PopoverName) {
		return state.current === name;
	}
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', cleanup);
}
