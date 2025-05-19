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
