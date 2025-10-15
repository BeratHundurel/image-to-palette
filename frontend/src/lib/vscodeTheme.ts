import {
	darken,
	lighten,
	addAlpha,
	getLuminance,
	rgbDistance,
	adjustForContrast,
	ensureReadableContrast,
	improvePaletteQuality
} from '$lib/colorUtils';

export function generateVSCodeTheme(colors: string[]) {
	const improvedColors = improvePaletteQuality(colors, 12);

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

	const theme = {
		$schema: 'vscode://schemas/color-theme',
		name: 'Custom Palette Theme',
		type: darkBase ? 'dark' : 'light',
		colors: {
			'editor.background': background,
			'editor.foreground': foreground,
			foreground: foreground,
			disabledForeground: addAlpha(foreground, '60'),
			focusBorder: addAlpha(c2, '60'),
			descriptionForeground: addAlpha(foreground, '70'),
			errorForeground: c4,
			'icon.foreground': c1,

			'widget.border': addAlpha(c1, '40'),
			'selection.background': addAlpha(c2, '50'),
			'sash.hoverBorder': c2,

			'activityBar.background': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),
			'activityBar.foreground': c1,
			'activityBar.activeBorder': c2,
			'activityBarBadge.background': c2,
			'activityBarBadge.foreground': background,

			'sideBar.background': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),
			'sideBar.foreground': foreground,
			'sideBar.border': addAlpha(c1, '20'),
			'sideBarTitle.foreground': c1,

			'statusBar.background': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),
			'statusBar.foreground': foreground,
			'statusBar.noFolderBackground': darkBase ? darken(c3, 0.8) : lighten(c3, 0.8),
			'statusBar.debuggingBackground': c4,

			'titleBar.activeBackground': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),
			'titleBar.activeForeground': foreground,
			'titleBar.inactiveBackground': darkBase ? darken(c0, 0.97) : lighten(c0, 0.97),
			'titleBar.inactiveForeground': addAlpha(foreground, '99'),

			'tab.activeBackground': background,
			'tab.activeForeground': foreground,
			'tab.inactiveBackground': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),
			'tab.inactiveForeground': addAlpha(foreground, 'aa'),
			'tab.activeBorder': c2,
			'tab.border': addAlpha(c1, '20'),
			'editorGroupHeader.tabsBackground': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),

			'panel.background': background,
			'panel.border': addAlpha(c1, '40'),
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

			'input.background': darkBase ? darken(c0, 0.85) : lighten(c0, 0.85),
			'input.border': addAlpha(c1, '40'),
			'input.foreground': foreground,
			'input.placeholderForeground': addAlpha(foreground, '50'),
			'inputOption.activeBorder': c2,
			'inputOption.activeBackground': addAlpha(c2, '30'),
			'inputOption.activeForeground': foreground,
			'inputValidation.errorBackground': darkBase ? darken(c4, 0.8) : lighten(c4, 0.8),
			'inputValidation.errorBorder': c4,
			'inputValidation.errorForeground': foreground,
			'inputValidation.warningBackground': darkBase ? darken(c5, 0.8) : lighten(c5, 0.8),
			'inputValidation.warningBorder': c5,
			'inputValidation.warningForeground': foreground,
			'inputValidation.infoBackground': darkBase ? darken(c2, 0.8) : lighten(c2, 0.8),
			'inputValidation.infoBorder': c2,
			'inputValidation.infoForeground': foreground,

			'dropdown.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'dropdown.foreground': foreground,
			'dropdown.border': addAlpha(c1, '40'),
			'dropdown.listBackground': darkBase ? darken(c0, 0.85) : lighten(c0, 0.85),

			'quickInput.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'quickInput.foreground': foreground,
			'quickInputList.focusBackground': addAlpha(c2, '40'),
			'quickInputList.focusForeground': foreground,
			'quickInputList.focusIconForeground': c2,
			'quickInputTitle.background': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),

			'list.activeSelectionBackground': addAlpha(c2, '40'),
			'list.activeSelectionForeground': foreground,
			'list.inactiveSelectionBackground': addAlpha(c1, '30'),
			'list.hoverBackground': addAlpha(c1, '20'),
			'list.focusBackground': addAlpha(c2, '30'),

			'button.background': c2,
			'button.foreground': darkBase ? background : darken(c0, 0.9),
			'button.hoverBackground': darkBase ? lighten(c2, 0.1) : darken(c2, 0.1),
			'button.hoverForeground': darkBase ? background : darken(c0, 0.9),
			'button.secondaryBackground': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'button.secondaryForeground': foreground,
			'button.secondaryHoverBackground': darkBase ? darken(c0, 0.85) : lighten(c0, 0.85),

			'badge.background': c2,
			'badge.foreground': darkBase ? background : darken(c0, 0.9),

			'breadcrumb.foreground': addAlpha(foreground, '70'),
			'breadcrumb.focusForeground': foreground,
			'breadcrumb.activeSelectionForeground': c2,
			'breadcrumb.background': background,

			'scrollbarSlider.background': addAlpha(c1, '40'),
			'scrollbarSlider.hoverBackground': addAlpha(c1, '60'),
			'scrollbarSlider.activeBackground': addAlpha(c2, '60'),

			'editorLineNumber.foreground': addAlpha(foreground, '50'),
			'editorLineNumber.activeForeground': c2,
			'editorCursor.foreground': c2,
			'editor.selectionBackground': addAlpha(c2, '40'),
			'editor.inactiveSelectionBackground': addAlpha(c1, '30'),
			'editor.findMatchBackground': addAlpha(c5, '40'),
			'editor.findMatchHighlightBackground': addAlpha(c5, '20'),
			'editorBracketMatch.background': addAlpha(c2, '20'),
			'editorBracketMatch.border': c2,
			'editorBracketHighlight.foreground1': addAlpha(c2, '80'),
			'editorBracketHighlight.foreground2': addAlpha(c3, '80'),
			'editorBracketHighlight.foreground3': addAlpha(c5, '80'),
			'editorBracketHighlight.foreground4': addAlpha(c6, '80'),
			'editorBracketHighlight.foreground5': addAlpha(c7, '80'),
			'editorBracketHighlight.foreground6': addAlpha(c1, '80'),
			'editorBracketPairGuide.activeBackground1': c2,
			'editorBracketPairGuide.activeBackground2': c3,
			'editorBracketPairGuide.activeBackground3': c5,
			'editorBracketPairGuide.activeBackground4': c6,
			'editorBracketPairGuide.activeBackground5': c7,
			'editorBracketPairGuide.activeBackground6': c1,
			'editorBracketPairGuide.background1': addAlpha(c2, '30'),
			'editorBracketPairGuide.background2': addAlpha(c3, '30'),
			'editorBracketPairGuide.background3': addAlpha(c5, '30'),
			'editorBracketPairGuide.background4': addAlpha(c6, '30'),
			'editorBracketPairGuide.background5': addAlpha(c7, '30'),
			'editorBracketPairGuide.background6': addAlpha(c1, '30'),
			'editorWhitespace.foreground': addAlpha(foreground, '30'),
			'editorWidget.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'editorWidget.foreground': foreground,
			'editorWidget.border': addAlpha(c1, '40'),
			'editorWidget.resizeBorder': c2,
			'editorSuggestWidget.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'editorSuggestWidget.foreground': foreground,
			'editorSuggestWidget.border': addAlpha(c1, '40'),
			'editorSuggestWidget.highlightForeground': c2,
			'editorSuggestWidget.focusHighlightForeground': c2,
			'editorSuggestWidget.selectedBackground': addAlpha(c2, '40'),
			'editorSuggestWidget.selectedForeground': foreground,
			'editorSuggestWidget.selectedIconForeground': c2,
			'editorHoverWidget.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'editorHoverWidget.foreground': foreground,
			'editorHoverWidget.border': addAlpha(c1, '40'),
			'editorHoverWidget.highlightForeground': c2,
			'editorHoverWidget.statusBarBackground': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),
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
			'gitDecoration.ignoredResourceForeground': addAlpha(foreground, '60'),

			'peekView.border': c2,
			'peekViewEditor.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'peekViewResult.background': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),
			'peekViewTitle.background': darkBase ? darken(c0, 0.95) : lighten(c0, 0.95),

			'notificationCenter.border': addAlpha(c1, '40'),
			'notificationCenterHeader.background': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),
			'notifications.background': darkBase ? darken(c0, 0.88) : lighten(c0, 0.88),
			'notifications.border': addAlpha(c1, '40'),
			'notificationLink.foreground': c2,

			'settings.headerForeground': foreground,
			'settings.modifiedItemIndicator': c2,
			'settings.focusedRowBackground': darkBase ? darken(c0, 0.9) : lighten(c0, 0.9),
			'settings.rowHoverBackground': darkBase ? darken(c0, 0.92) : lighten(c0, 0.92),
			'settings.focusedRowBorder': addAlpha(c2, '60'),
			'settings.numberInputBackground': background,
			'settings.numberInputForeground': c6,
			'settings.numberInputBorder': addAlpha(c1, '40'),
			'settings.textInputBackground': background,
			'settings.textInputForeground': c2,
			'settings.textInputBorder': addAlpha(c1, '40'),
			'settings.checkboxBackground': background,
			'settings.checkboxForeground': c5,
			'settings.checkboxBorder': addAlpha(c1, '40'),
			'settings.dropdownBackground': background,
			'settings.dropdownForeground': c1,
			'settings.dropdownBorder': addAlpha(c1, '40'),
			'settings.dropdownListBorder': addAlpha(c1, '40')
		},
		tokenColors: [
			{
				scope: ['comment', 'punctuation.definition.comment'],
				settings: { foreground: addAlpha(foreground, '60'), fontStyle: 'italic' }
			},
			{
				scope: ['keyword', 'keyword.control', 'keyword.operator.new', 'keyword.operator.expression', 'keyword.other'],
				settings: { foreground: c6, fontStyle: 'bold' }
			},
			{
				scope: ['storage', 'storage.type', 'storage.modifier'],
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
					'variable.parameter',
					'meta.parameter',
					'entity.other.attribute-name',
					'entity.name.module',
					'support.module',
					'support.node'
				],
				settings: { foreground: c7 }
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
				scope: ['entity.name.function', 'meta.function-call', 'support.function', 'meta.method-call', 'meta.method'],
				settings: { foreground: c2 }
			},
			{
				scope: ['entity.name.tag', 'meta.tag'],
				settings: { foreground: darkBase ? lighten(c4, 0.05) : darken(c4, 0.05) }
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
				settings: { foreground: addAlpha(c4, '80'), fontStyle: 'italic' }
			}
		]
	};

	return JSON.stringify(theme, null, 2);
}
