export type WallhavenResult = {
	id: string;
	thumbs?: { large?: string; original?: string };
	path?: string;
	url?: string;
	resolution?: string;
};

export type WallhavenSearchResponse = {
	data: WallhavenResult[];
	meta?: {
		current_page?: number;
		last_page?: number;
		per_page?: number;
		total?: number;
	};
};
