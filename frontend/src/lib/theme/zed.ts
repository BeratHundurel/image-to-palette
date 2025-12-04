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

export interface ZedSyntaxStyle {
	color?: string;
	font_style?: string | null;
	font_weight?: number | null;
}

export interface ZedPlayerStyle {
	cursor: string;
	background: string;
	selection: string;
}

export interface ZedSyntax {
	attribute?: ZedSyntaxStyle;
	boolean?: ZedSyntaxStyle;
	comment?: ZedSyntaxStyle;
	'comment.doc'?: ZedSyntaxStyle;
	constant?: ZedSyntaxStyle;
	constructor?: ZedSyntaxStyle;
	embedded?: ZedSyntaxStyle;
	emphasis?: ZedSyntaxStyle;
	'emphasis.strong'?: ZedSyntaxStyle;
	enum?: ZedSyntaxStyle;
	function?: ZedSyntaxStyle;
	hint?: ZedSyntaxStyle;
	keyword?: ZedSyntaxStyle;
	label?: ZedSyntaxStyle;
	link_text?: ZedSyntaxStyle;
	link_uri?: ZedSyntaxStyle;
	namespace?: ZedSyntaxStyle;
	number?: ZedSyntaxStyle;
	operator?: ZedSyntaxStyle;
	predictive?: ZedSyntaxStyle;
	preproc?: ZedSyntaxStyle;
	primary?: ZedSyntaxStyle;
	property?: ZedSyntaxStyle;
	punctuation?: ZedSyntaxStyle;
	'punctuation.bracket'?: ZedSyntaxStyle;
	'punctuation.delimiter'?: ZedSyntaxStyle;
	'punctuation.list_marker'?: ZedSyntaxStyle;
	'punctuation.markup'?: ZedSyntaxStyle;
	'punctuation.special'?: ZedSyntaxStyle;
	selector?: ZedSyntaxStyle;
	'selector.pseudo'?: ZedSyntaxStyle;
	string?: ZedSyntaxStyle;
	'string.escape'?: ZedSyntaxStyle;
	'string.regex'?: ZedSyntaxStyle;
	'string.special'?: ZedSyntaxStyle;
	'string.special.symbol'?: ZedSyntaxStyle;
	tag?: ZedSyntaxStyle;
	'text.literal'?: ZedSyntaxStyle;
	title?: ZedSyntaxStyle;
	type?: ZedSyntaxStyle;
	variable?: ZedSyntaxStyle;
	'variable.special'?: ZedSyntaxStyle;
	variant?: ZedSyntaxStyle;
}

export interface ZedThemeStyle {
	border: string;
	'border.variant': string;
	'border.focused': string;
	'border.selected': string;
	'border.transparent': string;
	'border.disabled': string;
	'elevated_surface.background': string;
	'surface.background': string;
	background: string;
	'element.background': string;
	'element.hover': string;
	'element.active': string;
	'element.selected': string;
	'element.disabled': string;
	'drop_target.background': string;
	'ghost_element.background': string;
	'ghost_element.hover': string;
	'ghost_element.active': string;
	'ghost_element.selected': string;
	'ghost_element.disabled': string;
	text: string;
	'text.muted': string;
	'text.placeholder': string;
	'text.disabled': string;
	'text.accent': string;
	icon: string;
	'icon.muted': string;
	'icon.disabled': string;
	'icon.placeholder': string;
	'icon.accent': string;
	'status_bar.background': string;
	'title_bar.background': string;
	'title_bar.inactive_background': string;
	'toolbar.background': string;
	'tab_bar.background': string;
	'tab.inactive_background': string;
	'tab.active_background': string;
	'search.match_background': string;
	'panel.background': string;
	'panel.focused_border': string | null;
	'pane.focused_border': string | null;
	'scrollbar.thumb.background': string;
	'scrollbar.thumb.hover_background': string;
	'scrollbar.thumb.border': string;
	'scrollbar.track.background': string;
	'scrollbar.track.border': string;
	'editor.foreground': string;
	'editor.background': string;
	'editor.gutter.background': string;
	'editor.subheader.background': string;
	'editor.active_line.background': string;
	'editor.highlighted_line.background': string;
	'editor.line_number': string;
	'editor.active_line_number': string;
	'editor.hover_line_number': string;
	'editor.invisible': string;
	'editor.wrap_guide': string;
	'editor.active_wrap_guide': string;
	'editor.document_highlight.read_background': string;
	'editor.document_highlight.write_background': string;
	'terminal.background': string;
	'terminal.foreground': string;
	'terminal.bright_foreground': string;
	'terminal.dim_foreground': string;
	'terminal.ansi.black': string;
	'terminal.ansi.bright_black': string;
	'terminal.ansi.dim_black': string;
	'terminal.ansi.red': string;
	'terminal.ansi.bright_red': string;
	'terminal.ansi.dim_red': string;
	'terminal.ansi.green': string;
	'terminal.ansi.bright_green': string;
	'terminal.ansi.dim_green': string;
	'terminal.ansi.yellow': string;
	'terminal.ansi.bright_yellow': string;
	'terminal.ansi.dim_yellow': string;
	'terminal.ansi.blue': string;
	'terminal.ansi.bright_blue': string;
	'terminal.ansi.dim_blue': string;
	'terminal.ansi.magenta': string;
	'terminal.ansi.bright_magenta': string;
	'terminal.ansi.dim_magenta': string;
	'terminal.ansi.bright_cyan': string;
	'terminal.ansi.dim_cyan': string;
	'terminal.ansi.cyan': string;
	'terminal.ansi.white': string;
	'terminal.ansi.bright_white': string;
	'terminal.ansi.dim_white': string;
	'link_text.hover': string;
	'version_control.added': string;
	'version_control.modified': string;
	'version_control.deleted': string;
	'version_control.conflict_marker.ours': string;
	'version_control.conflict_marker.theirs': string;
	conflict: string;
	'conflict.background': string;
	'conflict.border': string;
	created: string;
	'created.background': string;
	'created.border': string;
	deleted: string;
	'deleted.background': string;
	'deleted.border': string;
	error: string;
	'error.background': string;
	'error.border': string;
	hidden: string;
	'hidden.background': string;
	'hidden.border': string;
	hint: string;
	'hint.background': string;
	'hint.border': string;
	ignored: string;
	'ignored.background': string;
	'ignored.border': string;
	info: string;
	'info.background': string;
	'info.border': string;
	modified: string;
	'modified.background': string;
	'modified.border': string;
	predictive: string;
	'predictive.background': string;
	'predictive.border': string;
	renamed: string;
	'renamed.background': string;
	'renamed.border': string;
	success: string;
	'success.background': string;
	'success.border': string;
	unreachable: string;
	'unreachable.background': string;
	'unreachable.border': string;
	warning: string;
	'warning.background': string;
	'warning.border': string;
	players: ZedPlayerStyle[];
	syntax: ZedSyntax;
}

export interface ZedThemeConfig {
	name: string;
	appearance: 'dark' | 'light';
	style: ZedThemeStyle;
}

export interface ZedTheme {
	$schema: string;
	name: string;
	author: string;
	themes: ZedThemeConfig[];
}

export function generateZedTheme(
	colors: string[],
	useStrictMode = false,
	harmonyScheme: HarmonyScheme = 'triadic'
): ZedTheme {
	console.log(colors.length);
	const improvedColors = useStrictMode ? colors : improvePaletteQuality(colors, 12, harmonyScheme);
	console.log(improvedColors.length);

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

	const bgDark = darkBase ? darken(c0, 0.92) : lighten(c0, 0.92);
	const bgMedium = darkBase ? darken(c0, 0.9) : lighten(c0, 0.9);
	const bgLight = darkBase ? darken(c0, 0.88) : lighten(c0, 0.88);

	const fgMuted = darkBase ? darken(foreground, 0.25) : lighten(foreground, 0.25);
	const fgDisabled = darkBase ? darken(foreground, 0.45) : lighten(foreground, 0.45);

	const c2Bright = darkBase ? darken(c2, 0.5) : lighten(c2, 0.5);
	const c3Bright = darkBase ? darken(c3, 0.5) : lighten(c3, 0.5);
	const c4Bright = darkBase ? darken(c4, 0.5) : lighten(c4, 0.5);
	const c5Bright = darkBase ? darken(c5, 0.5) : lighten(c5, 0.5);
	const c6Bright = darkBase ? darken(c6, 0.5) : lighten(c6, 0.5);
	const c7Bright = darkBase ? darken(c7, 0.5) : lighten(c7, 0.5);

	const c2Dim = darkBase ? lighten(c2, 0.25) : darken(c2, 0.25);
	const c3Dim = darkBase ? lighten(c3, 0.25) : darken(c3, 0.25);
	const c4Dim = darkBase ? lighten(c4, 0.25) : darken(c4, 0.25);
	const c5Dim = darkBase ? lighten(c5, 0.25) : darken(c5, 0.25);
	const c6Dim = darkBase ? lighten(c6, 0.25) : darken(c6, 0.25);
	const c7Dim = darkBase ? lighten(c7, 0.25) : darken(c7, 0.25);

	const borderBase = darkBase ? lighten(background, 0.15) : darken(background, 0.15);
	const borderVariant = darkBase ? lighten(background, 0.08) : darken(background, 0.08);

	const theme: ZedTheme = {
		$schema: 'https://zed.dev/schema/themes/v0.2.0.json',
		name: 'Custom Palette Theme',
		author: 'Image to Palette Generator',
		themes: [
			{
				name: darkBase ? 'Custom Palette Dark' : 'Custom Palette Light',
				appearance: darkBase ? 'dark' : 'light',
				style: {
					border: borderBase,
					'border.variant': borderVariant,
					'border.focused': c2,
					'border.selected': darkBase ? darken(c2, 0.4) : lighten(c2, 0.4),
					'border.transparent': '#00000000',
					'border.disabled': darkBase ? lighten(background, 0.12) : darken(background, 0.12),
					'elevated_surface.background': bgDark,
					'surface.background': bgDark,
					background: bgMedium,
					'element.background': bgDark,
					'element.hover': borderVariant,
					'element.active': bgLight,
					'element.selected': bgLight,
					'element.disabled': bgDark,
					'drop_target.background': addAlpha(c2, '80'),
					'ghost_element.background': '#00000000',
					'ghost_element.hover': borderVariant,
					'ghost_element.active': bgLight,
					'ghost_element.selected': bgLight,
					'ghost_element.disabled': bgDark,
					text: foreground,
					'text.muted': fgMuted,
					'text.placeholder': fgDisabled,
					'text.disabled': fgDisabled,
					'text.accent': c2,
					icon: foreground,
					'icon.muted': fgMuted,
					'icon.disabled': fgDisabled,
					'icon.placeholder': fgMuted,
					'icon.accent': c2,
					'status_bar.background': bgMedium,
					'title_bar.background': bgMedium,
					'title_bar.inactive_background': bgDark,
					'toolbar.background': background,
					'tab_bar.background': bgDark,
					'tab.inactive_background': bgDark,
					'tab.active_background': background,
					'search.match_background': addAlpha(c2, '66'),
					'panel.background': bgDark,
					'panel.focused_border': null,
					'pane.focused_border': null,
					'scrollbar.thumb.background': addAlpha(foreground, '4c'),
					'scrollbar.thumb.hover_background': borderVariant,
					'scrollbar.thumb.border': borderVariant,
					'scrollbar.track.background': '#00000000',
					'scrollbar.track.border': bgDark,
					'editor.foreground': foreground,
					'editor.background': background,
					'editor.gutter.background': background,
					'editor.subheader.background': bgDark,
					'editor.active_line.background': addAlpha(bgDark, 'bf'),
					'editor.highlighted_line.background': bgDark,
					'editor.line_number': fgDisabled,
					'editor.active_line_number': foreground,
					'editor.hover_line_number': fgMuted,
					'editor.invisible': fgDisabled,
					'editor.wrap_guide': addAlpha(foreground, '0d'),
					'editor.active_wrap_guide': addAlpha(foreground, '1a'),
					'editor.document_highlight.read_background': addAlpha(c2, '1a'),
					'editor.document_highlight.write_background': addAlpha(c5, '66'),
					'terminal.background': background,
					'terminal.foreground': foreground,
					'terminal.bright_foreground': foreground,
					'terminal.dim_foreground': background,
					'terminal.ansi.black': background,
					'terminal.ansi.bright_black': darkBase ? lighten(background, 0.3) : darken(background, 0.3),
					'terminal.ansi.dim_black': foreground,
					'terminal.ansi.red': c4,
					'terminal.ansi.bright_red': c4Bright,
					'terminal.ansi.dim_red': c4Dim,
					'terminal.ansi.green': c3,
					'terminal.ansi.bright_green': c3Bright,
					'terminal.ansi.dim_green': c3Dim,
					'terminal.ansi.yellow': c5,
					'terminal.ansi.bright_yellow': c5Bright,
					'terminal.ansi.dim_yellow': c5Dim,
					'terminal.ansi.blue': c2,
					'terminal.ansi.bright_blue': c2Bright,
					'terminal.ansi.dim_blue': c2Dim,
					'terminal.ansi.magenta': c6,
					'terminal.ansi.bright_magenta': c6Bright,
					'terminal.ansi.dim_magenta': c6Dim,
					'terminal.ansi.cyan': c7,
					'terminal.ansi.bright_cyan': c7Bright,
					'terminal.ansi.dim_cyan': c7Dim,
					'terminal.ansi.white': foreground,
					'terminal.ansi.bright_white': darkBase ? lighten(foreground, 0.2) : darken(foreground, 0.2),
					'terminal.ansi.dim_white': darkBase ? darken(foreground, 0.4) : lighten(foreground, 0.4),
					'link_text.hover': c2,
					'version_control.added': c3,
					'version_control.modified': c5,
					'version_control.deleted': c4,
					'version_control.conflict_marker.ours': addAlpha(c3, '1a'),
					'version_control.conflict_marker.theirs': addAlpha(c2, '1a'),
					conflict: c5,
					'conflict.background': addAlpha(c5, '1a'),
					'conflict.border': darkBase ? darken(c5, 0.6) : lighten(c5, 0.6),
					created: c3,
					'created.background': addAlpha(c3, '1a'),
					'created.border': darkBase ? darken(c3, 0.7) : lighten(c3, 0.7),
					deleted: c4,
					'deleted.background': addAlpha(c4, '1a'),
					'deleted.border': darkBase ? darken(c4, 0.7) : lighten(c4, 0.7),
					error: c4,
					'error.background': addAlpha(c4, '1a'),
					'error.border': darkBase ? darken(c4, 0.7) : lighten(c4, 0.7),
					hidden: fgDisabled,
					'hidden.background': addAlpha(fgDisabled, '1a'),
					'hidden.border': darkBase ? lighten(background, 0.12) : darken(background, 0.12),
					hint: darkBase ? lighten(c2, 0.1) : darken(c2, 0.1),
					'hint.background': addAlpha(c2, '1a'),
					'hint.border': darkBase ? darken(c2, 0.4) : lighten(c2, 0.4),
					ignored: fgDisabled,
					'ignored.background': addAlpha(fgDisabled, '1a'),
					'ignored.border': borderBase,
					info: c2,
					'info.background': addAlpha(c2, '1a'),
					'info.border': darkBase ? darken(c2, 0.4) : lighten(c2, 0.4),
					modified: c5,
					'modified.background': addAlpha(c5, '1a'),
					'modified.border': darkBase ? darken(c5, 0.6) : lighten(c5, 0.6),
					predictive: darkBase ? darken(c2, 0.3) : lighten(c2, 0.3),
					'predictive.background': addAlpha(c2, '1a'),
					'predictive.border': darkBase ? darken(c3, 0.7) : lighten(c3, 0.7),
					renamed: c2,
					'renamed.background': addAlpha(c2, '1a'),
					'renamed.border': darkBase ? darken(c2, 0.4) : lighten(c2, 0.4),
					success: c3,
					'success.background': addAlpha(c3, '1a'),
					'success.border': darkBase ? darken(c3, 0.7) : lighten(c3, 0.7),
					unreachable: fgMuted,
					'unreachable.background': addAlpha(fgMuted, '1a'),
					'unreachable.border': borderBase,
					warning: c5,
					'warning.background': addAlpha(c5, '1a'),
					'warning.border': darkBase ? darken(c5, 0.6) : lighten(c5, 0.6),
					players: [
						{
							cursor: c2,
							background: c2,
							selection: addAlpha(c2, '3d')
						},
						{
							cursor: c4,
							background: c4,
							selection: addAlpha(c4, '3d')
						},
						{
							cursor: c5,
							background: c5,
							selection: addAlpha(c5, '3d')
						},
						{
							cursor: c6,
							background: c6,
							selection: addAlpha(c6, '3d')
						},
						{
							cursor: c7,
							background: c7,
							selection: addAlpha(c7, '3d')
						},
						{
							cursor: c4,
							background: c4,
							selection: addAlpha(c4, '3d')
						},
						{
							cursor: c5,
							background: c5,
							selection: addAlpha(c5, '3d')
						},
						{
							cursor: c3,
							background: c3,
							selection: addAlpha(c3, '3d')
						}
					],
					syntax: {
						attribute: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						boolean: {
							color: c5,
							font_style: null,
							font_weight: null
						},
						comment: {
							color: darkBase ? darken(foreground, 0.6) : lighten(foreground, 0.6),
							font_style: null,
							font_weight: null
						},
						'comment.doc': {
							color: darkBase ? darken(foreground, 0.4) : lighten(foreground, 0.4),
							font_style: null,
							font_weight: null
						},
						constant: {
							color: c5,
							font_style: null,
							font_weight: null
						},
						constructor: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						embedded: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						emphasis: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						'emphasis.strong': {
							color: c5,
							font_style: null,
							font_weight: 700
						},
						enum: {
							color: c4,
							font_style: null,
							font_weight: null
						},
						function: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						hint: {
							color: darkBase ? lighten(c2, 0.1) : darken(c2, 0.1),
							font_style: null,
							font_weight: null
						},
						keyword: {
							color: c6,
							font_style: null,
							font_weight: null
						},
						label: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						link_text: {
							color: c2,
							font_style: 'normal',
							font_weight: null
						},
						link_uri: {
							color: c7,
							font_style: null,
							font_weight: null
						},
						namespace: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						number: {
							color: c5,
							font_style: null,
							font_weight: null
						},
						operator: {
							color: c7,
							font_style: null,
							font_weight: null
						},
						predictive: {
							color: darkBase ? darken(c2, 0.3) : lighten(c2, 0.3),
							font_style: 'italic',
							font_weight: null
						},
						preproc: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						primary: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						property: {
							color: c4,
							font_style: null,
							font_weight: null
						},
						punctuation: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						'punctuation.bracket': {
							color: darkBase ? lighten(foreground, 0.1) : darken(foreground, 0.1),
							font_style: null,
							font_weight: null
						},
						'punctuation.delimiter': {
							color: darkBase ? lighten(foreground, 0.1) : darken(foreground, 0.1),
							font_style: null,
							font_weight: null
						},
						'punctuation.list_marker': {
							color: c4,
							font_style: null,
							font_weight: null
						},
						'punctuation.markup': {
							color: c4,
							font_style: null,
							font_weight: null
						},
						'punctuation.special': {
							color: darkBase ? darken(c4, 0.2) : lighten(c4, 0.2),
							font_style: null,
							font_weight: null
						},
						selector: {
							color: c5,
							font_style: null,
							font_weight: null
						},
						'selector.pseudo': {
							color: c2,
							font_style: null,
							font_weight: null
						},
						string: {
							color: c3,
							font_style: null,
							font_weight: null
						},
						'string.escape': {
							color: darkBase ? darken(foreground, 0.4) : lighten(foreground, 0.4),
							font_style: null,
							font_weight: null
						},
						'string.regex': {
							color: c5,
							font_style: null,
							font_weight: null
						},
						'string.special': {
							color: c5,
							font_style: null,
							font_weight: null
						},
						'string.special.symbol': {
							color: c5,
							font_style: null,
							font_weight: null
						},
						tag: {
							color: c2,
							font_style: null,
							font_weight: null
						},
						'text.literal': {
							color: c3,
							font_style: null,
							font_weight: null
						},
						title: {
							color: c4,
							font_style: null,
							font_weight: 400
						},
						type: {
							color: c7,
							font_style: null,
							font_weight: null
						},
						variable: {
							color: foreground,
							font_style: null,
							font_weight: null
						},
						'variable.special': {
							color: c5,
							font_style: null,
							font_weight: null
						},
						variant: {
							color: c2,
							font_style: null,
							font_weight: null
						}
					}
				}
			}
		]
	};

	return theme;
}
