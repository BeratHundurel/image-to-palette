import { writable, get, type Readable } from 'svelte/store';

export type PopoverName = 'palette' | 'saved' | 'copy' | 'application';
export type Direction = 'left' | 'right';

export interface PopoverState {
	current: PopoverName | null;
	direction: Direction;
}

const initial: PopoverState = {
	current: null,
	direction: 'right'
};

const store = writable<PopoverState>(initial);

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

export const popoverState: Readable<PopoverState> = {
	subscribe: store.subscribe
};

export const popovers = {
	subscribe: store.subscribe,

	open(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		store.set({
			current: name,
			direction: computeDirection(anchor)
		});
	},

	openFromEvent(name: PopoverName, e: MouseEvent) {
		this.open(name, anchorFromEvent(e));
	},

	toggle(name: PopoverName, anchor?: HTMLElement | EventTarget | null) {
		const s = get(store);
		if (s.current === name) {
			store.set({ ...s, current: null });
		} else {
			store.set({
				current: name,
				direction: computeDirection(anchor)
			});
		}
	},

	toggleFromEvent(name: PopoverName, e: MouseEvent) {
		this.toggle(name, anchorFromEvent(e));
	},

	close(name?: PopoverName) {
		const s = get(store);
		if (!name || s.current === name) {
			store.set({ ...s, current: null });
		}
	},

	isOpen(name: PopoverName) {
		return get(store).current === name;
	},

	getDirection(): Direction {
		return get(store).direction;
	}
};
