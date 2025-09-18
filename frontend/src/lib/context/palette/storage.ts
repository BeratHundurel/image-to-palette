// Gets saved palette file names from localStorage
export function getSavedPaletteNames(): string[] {
	try {
		const stored = localStorage.getItem('savedPalettes');
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

// Saves palette file names to localStorage
export function savePaletteNames(fileNames: string[]): void {
	try {
		localStorage.setItem('savedPalettes', JSON.stringify(fileNames));
	} catch (error) {
		console.error('Failed to save palette names to localStorage:', error);
	}
}

// Adds a new palette file name to the saved list if it doesn't already exist
export function addSavedPaletteName(fileName: string): void {
	const currentNames = getSavedPaletteNames();
	if (!currentNames.includes(fileName)) {
		currentNames.push(fileName);
		savePaletteNames(currentNames);
	}
}
