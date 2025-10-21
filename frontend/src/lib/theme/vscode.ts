import {
	darken,
	lighten,
	addAlpha,
	getLuminance,
	rgbDistance,
	adjustForContrast,
	ensureReadableContrast,
	improvePaletteQuality,
	type HarmonyScheme
} from '$lib/colorUtils';

export interface VSCodeTokenSettings {
	foreground?: string;
	background?: string;
	fontStyle?: string;
}

export interface VSCodeTokenColor {
	name?: string;
	scope: string | string[];
	settings: VSCodeTokenSettings;
}

export interface VSCodeThemeColors {
	'editor.background': string;
	'editor.foreground': string;
	foreground: string;
	disabledForeground: string;
	focusBorder: string;
	descriptionForeground: string;
	errorForeground: string;
	'icon.foreground': string;
	'widget.border': string;
	'selection.background': string;
	'sash.hoverBorder': string;
	'activityBar.background': string;
	'activityBar.foreground': string;
	'activityBar.activeBorder': string;
	'activityBarBadge.background': string;
	'activityBarBadge.foreground': string;
	'sideBar.background': string;
	'sideBar.foreground': string;
	'sideBar.border': string;
	'sideBarTitle.foreground': string;
	'statusBar.background': string;
	'statusBar.foreground': string;
	'statusBar.noFolderBackground': string;
	'statusBar.debuggingBackground': string;
	'titleBar.activeBackground': string;
	'titleBar.activeForeground': string;
	'titleBar.inactiveBackground': string;
	'titleBar.inactiveForeground': string;
	'tab.activeBackground': string;
	'tab.activeForeground': string;
	'tab.inactiveBackground': string;
	'tab.inactiveForeground': string;
	'tab.activeBorder': string;
	'tab.border': string;
	'editorGroupHeader.tabsBackground': string;
	'panel.background': string;
	'panel.border': string;
	'panelTitle.activeBorder': string;
	'terminal.foreground': string;
	'terminal.ansiBlack': string;
	'terminal.ansiRed': string;
	'terminal.ansiGreen': string;
	'terminal.ansiYellow': string;
	'terminal.ansiBlue': string;
	'terminal.ansiMagenta': string;
	'terminal.ansiCyan': string;
	'terminal.ansiWhite': string;
	'terminal.ansiBrightBlack': string;
	'terminal.ansiBrightRed': string;
	'terminal.ansiBrightGreen': string;
	'terminal.ansiBrightYellow': string;
	'terminal.ansiBrightBlue': string;
	'terminal.ansiBrightMagenta': string;
	'terminal.ansiBrightCyan': string;
	'terminal.ansiBrightWhite': string;
	'input.background': string;
	'input.border': string;
	'input.foreground': string;
	'input.placeholderForeground': string;
	'inputOption.activeBorder': string;
	'inputOption.activeBackground': string;
	'inputOption.activeForeground': string;
	'inputValidation.errorBackground': string;
	'inputValidation.errorBorder': string;
	'inputValidation.errorForeground': string;
	'inputValidation.warningBackground': string;
	'inputValidation.warningBorder': string;
	'inputValidation.warningForeground': string;
	'inputValidation.infoBackground': string;
	'inputValidation.infoBorder': string;
	'inputValidation.infoForeground': string;
	'dropdown.background': string;
	'dropdown.foreground': string;
	'dropdown.border': string;
	'dropdown.listBackground': string;
	'quickInput.background': string;
	'quickInput.foreground': string;
	'quickInputList.focusBackground': string;
	'quickInputList.focusForeground': string;
	'quickInputList.focusIconForeground': string;
	'quickInputTitle.background': string;
	'list.activeSelectionBackground': string;
	'list.activeSelectionForeground': string;
	'list.inactiveSelectionBackground': string;
	'list.hoverBackground': string;
	'list.focusBackground': string;
	'button.background': string;
	'button.foreground': string;
	'button.hoverBackground': string;
	'button.hoverForeground': string;
	'button.secondaryBackground': string;
	'button.secondaryForeground': string;
	'button.secondaryHoverBackground': string;
	'badge.background': string;
	'badge.foreground': string;
	'breadcrumb.foreground': string;
	'breadcrumb.focusForeground': string;
	'breadcrumb.activeSelectionForeground': string;
	'breadcrumb.background': string;
	'scrollbarSlider.background': string;
	'scrollbarSlider.hoverBackground': string;
	'scrollbarSlider.activeBackground': string;
	'editorLineNumber.foreground': string;
	'editorLineNumber.activeForeground': string;
	'editorCursor.foreground': string;
	'editor.selectionBackground': string;
	'editor.inactiveSelectionBackground': string;
	'editor.findMatchBackground': string;
	'editor.findMatchHighlightBackground': string;
	'editorBracketMatch.background': string;
	'editorBracketMatch.border': string;
	'editorBracketHighlight.foreground1': string;
	'editorBracketHighlight.foreground2': string;
	'editorBracketHighlight.foreground3': string;
	'editorBracketHighlight.foreground4': string;
	'editorBracketHighlight.foreground5': string;
	'editorBracketHighlight.foreground6': string;
	'editorBracketPairGuide.activeBackground1': string;
	'editorBracketPairGuide.activeBackground2': string;
	'editorBracketPairGuide.activeBackground3': string;
	'editorBracketPairGuide.activeBackground4': string;
	'editorBracketPairGuide.activeBackground5': string;
	'editorBracketPairGuide.activeBackground6': string;
	'editorBracketPairGuide.background1': string;
	'editorBracketPairGuide.background2': string;
	'editorBracketPairGuide.background3': string;
	'editorBracketPairGuide.background4': string;
	'editorBracketPairGuide.background5': string;
	'editorBracketPairGuide.background6': string;
	'editorWhitespace.foreground': string;
	'editorWidget.background': string;
	'editorWidget.foreground': string;
	'editorWidget.border': string;
	'editorWidget.resizeBorder': string;
	'editorSuggestWidget.background': string;
	'editorSuggestWidget.foreground': string;
	'editorSuggestWidget.border': string;
	'editorSuggestWidget.highlightForeground': string;
	'editorSuggestWidget.focusHighlightForeground': string;
	'editorSuggestWidget.selectedBackground': string;
	'editorSuggestWidget.selectedForeground': string;
	'editorSuggestWidget.selectedIconForeground': string;
	'editorHoverWidget.background': string;
	'editorHoverWidget.foreground': string;
	'editorHoverWidget.border': string;
	'editorHoverWidget.highlightForeground': string;
	'editorHoverWidget.statusBarBackground': string;
	'editorError.foreground': string;
	'editorWarning.foreground': string;
	'editorInfo.foreground': string;
	'editorGutter.addedBackground': string;
	'editorGutter.modifiedBackground': string;
	'editorGutter.deletedBackground': string;
	'gitDecoration.addedResourceForeground': string;
	'gitDecoration.modifiedResourceForeground': string;
	'gitDecoration.deletedResourceForeground': string;
	'gitDecoration.untrackedResourceForeground': string;
	'gitDecoration.ignoredResourceForeground': string;
	'peekView.border': string;
	'peekViewEditor.background': string;
	'peekViewResult.background': string;
	'peekViewTitle.background': string;
	'notificationCenter.border': string;
	'notificationCenterHeader.background': string;
	'notifications.background': string;
	'notifications.border': string;
	'notificationLink.foreground': string;
	'settings.headerForeground': string;
	'settings.modifiedItemIndicator': string;
	'settings.focusedRowBackground': string;
	'settings.rowHoverBackground': string;
	'settings.focusedRowBorder': string;
	'settings.numberInputBackground': string;
	'settings.numberInputForeground': string;
	'settings.numberInputBorder': string;
	'settings.textInputBackground': string;
	'settings.textInputForeground': string;
	'settings.textInputBorder': string;
	'settings.checkboxBackground': string;
	'settings.checkboxForeground': string;
	'settings.checkboxBorder': string;
	'settings.dropdownBackground': string;
	'settings.dropdownForeground': string;
	'settings.dropdownBorder': string;
	'settings.dropdownListBorder': string;
}

export interface VSCodeTheme {
	$schema: string;
	name: string;
	type: 'dark' | 'light';
	colors: VSCodeThemeColors;
	tokenColors: VSCodeTokenColor[];
}

export function generateVSCodeTheme(
	colors: string[],
	useStrictMode = false,
	harmonyScheme: HarmonyScheme = 'triadic'
): VSCodeTheme {
	const improvedColors = useStrictMode ? colors : improvePaletteQuality(colors, 12, harmonyScheme);

	if (improvedColors.length < 8) {
		throw new Error(`Not enough colors to generate theme. Got ${improvedColors.length}, need at least 8.`);
	}

	const [c0, c1Raw, c2Raw, c3Raw, c4Raw, c5Raw, c6Raw, c7Raw] = improvedColors;

	const averageLuminance = improvedColors.slice(0, 8).reduce((sum, color) => sum + getLuminance(color), 0) / 8;
	const darkBase = averageLuminance < 0.5;

	const darkenAmount = darkBase ? 0.825 + averageLuminance * 0.2 : 0;
	const lightenAmount = darkBase ? 0 : 0.7 + (1 - averageLuminance) * 0.25;
	const background = darkBase ? darken(c0, darkenAmount) : lighten(c0, lightenAmount);

	const proposedForeground = darkBase ? lighten(c0, 0.7) : darken(c0, 0.8);
	const foreground = ensureReadableContrast(proposedForeground, background, 7.0);

	let c1 = adjustForContrast(c1Raw, background, 4.5);
	let c2 = adjustForContrast(c2Raw, background, 4.5);

	if (rgbDistance(c1, foreground) < 60) {
		c1 = darkBase ? lighten(c1, 0.15) : darken(c1, 0.15);
	}
	if (rgbDistance(c2, foreground) < 60) {
		c2 = darkBase ? lighten(c2, 0.15) : darken(c2, 0.15);
	}
	if (rgbDistance(c1, c2) < 50) {
		c2 = darkBase ? lighten(c2, 0.15) : darken(c2, 0.15);
	}

	const c3 = adjustForContrast(c3Raw, background, 3.5);
	const c4 = adjustForContrast(c4Raw, background, 3.5);
	const c5 = adjustForContrast(c5Raw, background, 3.5);
	const c6 = adjustForContrast(c6Raw, background, 3.5);
	const c7 = adjustForContrast(c7Raw, background, 3.5);

	// Cache frequently reused color computations
	const bgVeryDark = darkBase ? darken(c0, 0.95) : lighten(c0, 0.95);
	const bgDark = darkBase ? darken(c0, 0.92) : lighten(c0, 0.92);
	const bgMedium = darkBase ? darken(c0, 0.9) : lighten(c0, 0.9);
	const bgLight = darkBase ? darken(c0, 0.88) : lighten(c0, 0.88);
	const bgLighter = darkBase ? darken(c0, 0.85) : lighten(c0, 0.85);
	const bgInactive = darkBase ? darken(c0, 0.97) : lighten(c0, 0.97);
	const c3Dark = darkBase ? darken(c3, 0.8) : lighten(c3, 0.8);
	const c4Dark = darkBase ? darken(c4, 0.8) : lighten(c4, 0.8);
	const c5Dark = darkBase ? darken(c5, 0.8) : lighten(c5, 0.8);
	const c2Dark = darkBase ? darken(c2, 0.8) : lighten(c2, 0.8);
	const buttonFg = darkBase ? background : darken(c0, 0.9);

	// Cache alpha colors
	const fg60 = addAlpha(foreground, '60');
	const fg70 = addAlpha(foreground, '70');
	const fg50 = addAlpha(foreground, '50');
	const fg30 = addAlpha(foreground, '30');
	const fg99 = addAlpha(foreground, '99');
	const c1_40 = addAlpha(c1, '40');
	const c1_20 = addAlpha(c1, '20');
	const c1_30 = addAlpha(c1, '30');
	const c1_60 = addAlpha(c1, '60');
	const c1_80 = addAlpha(c1, '80');
	const c2_20 = addAlpha(c2, '20');
	const c2_30 = addAlpha(c2, '30');
	const c2_40 = addAlpha(c2, '40');
	const c2_50 = addAlpha(c2, '50');
	const c2_60 = addAlpha(c2, '60');
	const c2_80 = addAlpha(c2, '80');
	const c3_30 = addAlpha(c3, '30');
	const c3_80 = addAlpha(c3, '80');
	const c4_80 = addAlpha(c4, '80');
	const c5_20 = addAlpha(c5, '20');
	const c5_30 = addAlpha(c5, '30');
	const c5_40 = addAlpha(c5, '40');
	const c5_80 = addAlpha(c5, '80');
	const c6_30 = addAlpha(c6, '30');
	const c6_80 = addAlpha(c6, '80');
	const c7_30 = addAlpha(c7, '30');
	const c7_80 = addAlpha(c7, '80');

	const theme: VSCodeTheme = {
		$schema: 'vscode://schemas/color-theme',
		name: 'Custom Palette Theme',
		type: darkBase ? 'dark' : 'light',
		colors: {
			'editor.background': background,
			'editor.foreground': foreground,
			foreground: foreground,
			disabledForeground: fg60,
			focusBorder: c2_60,
			descriptionForeground: fg70,
			errorForeground: c4,
			'icon.foreground': c1,

			'widget.border': c1_40,
			'selection.background': c2_50,
			'sash.hoverBorder': c2,

			'activityBar.background': bgVeryDark,
			'activityBar.foreground': c1,
			'activityBar.activeBorder': c2,
			'activityBarBadge.background': c2,
			'activityBarBadge.foreground': foreground,

			'sideBar.background': bgDark,
			'sideBar.foreground': foreground,
			'sideBar.border': c1_20,
			'sideBarTitle.foreground': c1,

			'statusBar.background': bgVeryDark,
			'statusBar.foreground': foreground,
			'statusBar.noFolderBackground': c3Dark,
			'statusBar.debuggingBackground': c4,

			'titleBar.activeBackground': bgVeryDark,
			'titleBar.activeForeground': foreground,
			'titleBar.inactiveBackground': bgInactive,
			'titleBar.inactiveForeground': fg99,

			'tab.activeBackground': background,
			'tab.activeForeground': foreground,
			'tab.inactiveBackground': bgVeryDark,
			'tab.inactiveForeground': addAlpha(foreground, 'aa'),
			'tab.activeBorder': c2,
			'tab.border': c1_20,
			'editorGroupHeader.tabsBackground': bgVeryDark,

			'panel.background': background,
			'panel.border': c1_40,
			'panelTitle.activeBorder': c2,

			'terminal.foreground': foreground,
			'terminal.ansiBlack': darkBase ? darken(c0, 0.9) : darken(c0, 0.2),
			'terminal.ansiRed': c4,
			'terminal.ansiGreen': c3,
			'terminal.ansiYellow': c5,
			'terminal.ansiBlue': c2,
			'terminal.ansiMagenta': c6,
			'terminal.ansiCyan': c7,
			'terminal.ansiWhite': foreground,
			'terminal.ansiBrightBlack': darkBase ? darken(foreground, 0.3) : lighten(foreground, 0.3),
			'terminal.ansiBrightRed': darkBase ? lighten(c4, 0.2) : darken(c4, 0.2),
			'terminal.ansiBrightGreen': darkBase ? lighten(c3, 0.2) : darken(c3, 0.2),
			'terminal.ansiBrightYellow': darkBase ? lighten(c5, 0.2) : darken(c5, 0.2),
			'terminal.ansiBrightBlue': darkBase ? lighten(c2, 0.2) : darken(c2, 0.2),
			'terminal.ansiBrightMagenta': darkBase ? lighten(c6, 0.2) : darken(c6, 0.2),
			'terminal.ansiBrightCyan': darkBase ? lighten(c7, 0.2) : darken(c7, 0.2),
			'terminal.ansiBrightWhite': darkBase ? lighten(foreground, 0.2) : darken(foreground, 0.2),

			'input.background': bgLighter,
			'input.border': c1_40,
			'input.foreground': foreground,
			'input.placeholderForeground': fg50,
			'inputOption.activeBorder': c2,
			'inputOption.activeBackground': c2_30,
			'inputOption.activeForeground': foreground,
			'inputValidation.errorBackground': c4Dark,
			'inputValidation.errorBorder': c4,
			'inputValidation.errorForeground': foreground,
			'inputValidation.warningBackground': c5Dark,
			'inputValidation.warningBorder': c5,
			'inputValidation.warningForeground': foreground,
			'inputValidation.infoBackground': c2Dark,
			'inputValidation.infoBorder': c2,
			'inputValidation.infoForeground': foreground,

			'dropdown.background': bgLight,
			'dropdown.foreground': foreground,
			'dropdown.border': c1_40,
			'dropdown.listBackground': bgLighter,

			'quickInput.background': bgLight,
			'quickInput.foreground': foreground,
			'quickInputList.focusBackground': c2_40,
			'quickInputList.focusForeground': foreground,
			'quickInputList.focusIconForeground': c2,
			'quickInputTitle.background': bgDark,

			'list.activeSelectionBackground': c2_40,
			'list.activeSelectionForeground': foreground,
			'list.inactiveSelectionBackground': c1_30,
			'list.hoverBackground': c1_20,
			'list.focusBackground': c2_30,

			'button.background': c2,
			'button.foreground': buttonFg,
			'button.hoverBackground': darkBase ? lighten(c2, 0.1) : darken(c2, 0.1),
			'button.hoverForeground': buttonFg,
			'button.secondaryBackground': bgLight,
			'button.secondaryForeground': foreground,
			'button.secondaryHoverBackground': bgLighter,

			'badge.background': c2,
			'badge.foreground': buttonFg,

			'breadcrumb.foreground': fg70,
			'breadcrumb.focusForeground': foreground,
			'breadcrumb.activeSelectionForeground': c2,
			'breadcrumb.background': background,

			'scrollbarSlider.background': c1_40,
			'scrollbarSlider.hoverBackground': c1_60,
			'scrollbarSlider.activeBackground': c2_60,

			'editorLineNumber.foreground': fg50,
			'editorLineNumber.activeForeground': c2,
			'editorCursor.foreground': c2,
			'editor.selectionBackground': c2_40,
			'editor.inactiveSelectionBackground': c1_30,
			'editor.findMatchBackground': c5_40,
			'editor.findMatchHighlightBackground': c5_20,
			'editorBracketMatch.background': c2_20,
			'editorBracketMatch.border': c2,
			'editorBracketHighlight.foreground1': c2_80,
			'editorBracketHighlight.foreground2': c3_80,
			'editorBracketHighlight.foreground3': c5_80,
			'editorBracketHighlight.foreground4': c6_80,
			'editorBracketHighlight.foreground5': c7_80,
			'editorBracketHighlight.foreground6': c1_80,
			'editorBracketPairGuide.activeBackground1': c2,
			'editorBracketPairGuide.activeBackground2': c3,
			'editorBracketPairGuide.activeBackground3': c5,
			'editorBracketPairGuide.activeBackground4': c6,
			'editorBracketPairGuide.activeBackground5': c7,
			'editorBracketPairGuide.activeBackground6': c1,
			'editorBracketPairGuide.background1': c2_30,
			'editorBracketPairGuide.background2': c3_30,
			'editorBracketPairGuide.background3': c5_30,
			'editorBracketPairGuide.background4': c6_30,
			'editorBracketPairGuide.background5': c7_30,
			'editorBracketPairGuide.background6': c1_30,
			'editorWhitespace.foreground': fg30,
			'editorWidget.background': bgLight,
			'editorWidget.foreground': foreground,
			'editorWidget.border': c1_40,
			'editorWidget.resizeBorder': c2,
			'editorSuggestWidget.background': bgLight,
			'editorSuggestWidget.foreground': foreground,
			'editorSuggestWidget.border': c1_40,
			'editorSuggestWidget.highlightForeground': c2,
			'editorSuggestWidget.focusHighlightForeground': c2,
			'editorSuggestWidget.selectedBackground': c2_40,
			'editorSuggestWidget.selectedForeground': foreground,
			'editorSuggestWidget.selectedIconForeground': c2,
			'editorHoverWidget.background': bgLight,
			'editorHoverWidget.foreground': foreground,
			'editorHoverWidget.border': c1_40,
			'editorHoverWidget.highlightForeground': c2,
			'editorHoverWidget.statusBarBackground': bgDark,
			'editorError.foreground': c4,
			'editorWarning.foreground': c5,
			'editorInfo.foreground': c2,
			'editorGutter.addedBackground': c3,
			'editorGutter.modifiedBackground': c5,
			'editorGutter.deletedBackground': c4,

			'gitDecoration.addedResourceForeground': c3,
			'gitDecoration.modifiedResourceForeground': c5,
			'gitDecoration.deletedResourceForeground': c4,
			'gitDecoration.untrackedResourceForeground': c7,
			'gitDecoration.ignoredResourceForeground': fg60,

			'peekView.border': c2,
			'peekViewEditor.background': bgLight,
			'peekViewResult.background': bgDark,
			'peekViewTitle.background': bgVeryDark,

			'notificationCenter.border': c1_40,
			'notificationCenterHeader.background': bgDark,
			'notifications.background': bgLight,
			'notifications.border': c1_40,
			'notificationLink.foreground': c2,

			'settings.headerForeground': foreground,
			'settings.modifiedItemIndicator': c2,
			'settings.focusedRowBackground': bgMedium,
			'settings.rowHoverBackground': bgDark,
			'settings.focusedRowBorder': c2_60,
			'settings.numberInputBackground': background,
			'settings.numberInputForeground': c6,
			'settings.numberInputBorder': c1_40,
			'settings.textInputBackground': background,
			'settings.textInputForeground': c2,
			'settings.textInputBorder': c1_40,
			'settings.checkboxBackground': background,
			'settings.checkboxForeground': c5,
			'settings.checkboxBorder': c1_40,
			'settings.dropdownBackground': background,
			'settings.dropdownForeground': c1,
			'settings.dropdownBorder': c1_40,
			'settings.dropdownListBorder': c1_40
		},
		tokenColors: [
			{
				scope: ['comment', 'punctuation.definition.comment'],
				settings: { foreground: fg60, fontStyle: 'italic' }
			},
			{
				scope: ['keyword', 'keyword.control', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.other'],
				settings: { foreground: c6, fontStyle: 'bold' }
			},
			{
				scope: ['storage', 'storage.type', 'storage.modifier', 'entity.name.tag', 'meta.tag'],
				settings: { foreground: c6 }
			},
			{
				scope: [
					'string',
					'string.quoted',
					'string.template',
					'string.regexp',
					'punctuation.definition.string',
					'support.constant.property-value',
					'support.constant.property-value.css',
					'markup.inline.raw',
					'markup.fenced_code',
					'markup.inserted'
				],
				settings: { foreground: c3 }
			},
			{
				scope: [
					'constant.numeric',
					'constant.character',
					'number',
					'constant.other',
					'variable.other.constant',
					'support.constant',
					'entity.other.inherited-class',
					'support.class',
					'support.type'
				],
				settings: { foreground: c5 }
			},
			{
				scope: [
					'constant.language',
					'constant.language.boolean',
					'constant.language.null',
					'entity.name.class',
					'entity.name.type'
				],
				settings: { foreground: c5, fontStyle: 'bold' }
			},
			{
				scope: ['variable', 'identifier', 'variable.other.readwrite', 'meta.definition.variable'],
				settings: { foreground: foreground }
			},
			{
				scope: [
					'variable.other.property',
					'variable.other.object.property',
					'meta.object-literal.key',
					'support.variable',
					'support.other.variable',
					'support.type.property-name',
					'support.type.property-name.css'
				],
				settings: { foreground: c1 }
			},
			{
				scope: [
					'entity.name.function',
					'meta.function-call',
					'meta.method-call',
					'meta.method',
					'meta.parameter',
					'variable.parameter',
					'entity.other.attribute-name',
					'entity.name.module',
					'support.module',
					'support.function',
					'support.node'
				],
				settings: { foreground: c2 }
			},
			{
				scope: [
					'punctuation.definition.begin.bracket',
					'punctuation.definition.end.bracket',
					'punctuation.definition.begin.bracket.round',
					'punctuation.definition.end.bracket.round',
					'punctuation.definition.begin.bracket.square',
					'punctuation.definition.end.bracket.square',
					'punctuation.definition.begin.bracket.curly',
					'punctuation.definition.end.bracket.curly',
					'meta.brace',
					'punctuation.section.brackets',
					'punctuation.section.parens',
					'punctuation.section.braces'
				],
				settings: { foreground: addAlpha(foreground, darkBase ? '90' : '80') }
			},
			{
				scope: [
					'punctuation',
					'punctuation.terminator',
					'punctuation.separator',
					'punctuation.separator.comma',
					'punctuation.definition'
				],
				settings: { foreground: addAlpha(foreground, darkBase ? '70' : '60') }
			},
			{
				scope: ['keyword.operator', 'punctuation.operator'],
				settings: { foreground: darkBase ? lighten(c6, 0.05) : darken(c6, 0.05) }
			},
			{
				scope: ['markup.heading', 'entity.name.section'],
				settings: { foreground: c2, fontStyle: 'bold' }
			},
			{
				scope: ['markup.italic'],
				settings: { fontStyle: 'italic' }
			},
			{
				scope: ['markup.bold'],
				settings: { fontStyle: 'bold' }
			},
			{
				scope: ['markup.underline.link', 'string.other.link'],
				settings: { foreground: c2, fontStyle: 'underline' }
			},
			{
				scope: ['markup.deleted'],
				settings: { foreground: c4 }
			},
			{
				scope: ['invalid', 'invalid.illegal'],
				settings: { foreground: c4, fontStyle: 'bold' }
			},
			{
				scope: ['invalid.deprecated'],
				settings: { foreground: c4_80, fontStyle: 'italic' }
			}
		]
	};

	return theme;
}
