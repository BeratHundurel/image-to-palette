import type { VSCodeThemeColors, VSCodeTokenSettings } from './vscode';
import type { ZedThemeStyle, ZedSyntax } from './zed';

const COLOR_REGEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/i;

export function traverseThemeForColors(
	obj: VSCodeThemeColors | VSCodeTokenSettings | ZedThemeStyle | ZedSyntax | Record<string, unknown>,
	onColorFound: (color: string, path: string) => void,
	prefix = ''
) {
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string' && COLOR_REGEX.test(value)) {
			const fullKey = prefix ? `${prefix}.${key}` : key;
			onColorFound(value, fullKey);
		} else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			traverseThemeForColors(value, onColorFound, prefix ? `${prefix}.${key}` : key);
		} else if (Array.isArray(value)) {
			value.forEach((item, index) => {
				if (typeof item === 'object' && item !== null) {
					traverseThemeForColors(item, onColorFound, `${prefix ? prefix + '.' : ''}${key}[${index}]`);
				}
			});
		}
	}
}
