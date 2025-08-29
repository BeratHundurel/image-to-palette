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

function computeDirection(anchor?: HTMLElement | EventTarget | null): Direction {
	if (typeof window === 'undefined' || !anchor) return 'right';
	const el = anchor as HTMLElement;
	const rect = el.getBoundingClientRect?.();
	if (!rect) return 'right';

	const spaceLeft = rect.left;
	const spaceRight = window.innerWidth - rect.right;
	return spaceRight >= spaceLeft ? 'right' : 'left';
}

function anchorFromEvent(e?: MouseEvent | Event | null): HTMLElement | null {
	const target = (e as MouseEvent | null)?.currentTarget as HTMLElement | null;
	return target ?? null;
}

export function getPopoverState(): PopoverState {
	return state;
}

export const popoverState = {
	get current() { return state.current; },
	get direction() { return state.direction; }
};

export const popovers = {
	open(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		state.current = name;
		state.direction = computeDirection(anchor);
	},

	openFromEvent(name: PopoverName, e: MouseEvent) {
		this.open(name, anchorFromEvent(e));
	},

	toggle(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		if (state.current === name) {
			state.current = null;
		} else {
			state.current = name;
			state.direction = computeDirection(anchor);
		}
	},

	toggleFromEvent(name: PopoverName, e: MouseEvent) {
		this.toggle(name, anchorFromEvent(e));
	},

	close(name?: PopoverName) {
		if (!name || state.current === name) {
			state.current = null;
		}
	},

	isOpen(name: PopoverName) {
		return state.current === name;
	},

	getDirection(): Direction {
		return state.direction;
	}
};
