export type Color = {
	hex: string;
};

export type PaletteData = {
	id: string;
	name: string;
	palette: Color[];
	createdAt: string;
	isSystem?: boolean;
};

export type SavePaletteRequest = {
	name: string;
	palette: Color[];
};

export type GetPalettesResponse = {
	palettes: PaletteData[];
};

export type SavePaletteResult = {
	message: string;
	name: string;
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

export type WorkspaceData = {
	id: string;
	name: string;
	imageData: string;
	colors?: Color[];
	selectors?: Selector[];
	drawSelectionValue?: string;
	activeSelectorId?: string;
	filteredColors?: string[];
	sampleRate?: number;
	luminosity?: number;
	nearest?: number;
	power?: number;
	maxDistance?: number;
	createdAt: string;
};

export type SaveWorkspaceRequest = {
	name: string;
	imageData: string;
	colors: Color[];
	selectors: Selector[];
	drawSelectionValue: string;
	activeSelectorId: string;
	filteredColors: string[];
	sampleRate: number;
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export type GetWorkspacesResponse = {
	workspaces: WorkspaceData[];
};

export type SaveWorkspaceResult = {
	message: string;
	name: string;
};
