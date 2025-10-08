export const CANVAS = {
	MAX_WIDTH: 800,
	MAX_HEIGHT: 400,
	DEFAULT_SCALE: 1
} as const;

export const SELECTION = {
	MIN_WIDTH: 1,
	MIN_HEIGHT: 1,
	STROKE_WIDTH: {
		OUTER: 4,
		MIDDLE: 2,
		INNER: 3,
		ANIMATED: 1
	},
	ANIMATION_SPEED: 150,
	DASH_PATTERN: [5, 5] as const
} as const;

export const IMAGE = {
	OUTPUT_FORMAT: 'image/png' as const,
	MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
	MAX_DIMENSION: 8192
} as const;
