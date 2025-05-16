export type RGB = {
	r: number;
	g: number;
	b: number;
};

export type Color = {
	hex: string;
	rgb: RGB;
};

export type PaletteResponse = {
	palette: Color[];
};