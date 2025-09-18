export type ExtractionState = {
	sampleRate: number;
	luminosity: number;
	nearest: number;
	power: number;
	maxDistance: number;
};

export function createExtractionStateInitializer(initial?: Partial<ExtractionState>): ExtractionState {
	return {
		sampleRate: 4,
		luminosity: 1,
		nearest: 30,
		power: 4,
		maxDistance: 0,
		...initial
	} satisfies ExtractionState;
}
