const std = @import("std");
pub const vscode = @import("vscode.zig");
pub const zed = @import("zed.zig");
pub const color_utils = @import("color_utils.zig");
pub const palette_api = @import("palette_api.zig");

pub const extractPaletteFromBytes = palette_api.extractPaletteFromBytes;
pub const generateThemeJson = palette_api.generateThemeJson;
pub const ThemeType = palette_api.ThemeType;
pub const PaletteResult = palette_api.PaletteResult;
