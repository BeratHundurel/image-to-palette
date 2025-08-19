export type Color = {
	hex: string;
};

export type Palettes = {
	palette: Color[];
};

export type PaletteResponse = {
	data: Palettes[];
};

export type NamedColor = {
	name: string;

	hex: string;
};

export type Selector = {
	id: string;
	color: string;
	selected: boolean;
	selection?: { x: number; y: number; w: number; h: number };
};
