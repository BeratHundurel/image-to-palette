const std = @import("std");
const zigimg = @import("zigimg");
const color_utils = @import("color_utils.zig");
const vscode = @import("vscode.zig");
const zed = @import("zed.zig");

pub const ColorAndCount = struct {
    color: zigimg.color.Colorf32,
    count: usize,

    const similarity_threshold: f32 = 0.05;

    pub fn colorSimilar(c1: zigimg.color.Colorf32, c2: zigimg.color.Colorf32) bool {
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return (dr * dr + dg * dg + db * db) < (similarity_threshold * similarity_threshold * 3);
    }

    pub fn lessThan(_: void, a: ColorAndCount, b: ColorAndCount) bool {
        return a.count > b.count;
    }
};

pub const PaletteResult = struct {
    colors: [][]const u8,
    allocator: std.mem.Allocator,

    pub fn deinit(self: *PaletteResult) void {
        for (self.colors) |color| {
            self.allocator.free(color);
        }
        self.allocator.free(self.colors);
    }
};

pub const ExtractError = error{
    NotAnImage,
    NoColors,
    OutOfMemory,
    InvalidImageData,
    InvalidContentType,
    NoImageProvided,
};

pub fn extractPaletteFromBytes(
    allocator: std.mem.Allocator,
    image_data: []const u8,
    max_colors: usize,
) ExtractError!PaletteResult {
    var img = zigimg.Image.fromMemory(allocator, image_data) catch {
        return ExtractError.NotAnImage;
    };
    defer img.deinit(allocator);

    return processImage(allocator, &img, max_colors);
}

fn processImage(
    allocator: std.mem.Allocator,
    img: *zigimg.Image,
    max_colors: usize,
) ExtractError!PaletteResult {
    var color_map = std.ArrayList(ColorAndCount){};
    defer color_map.deinit(allocator);
    color_map.ensureTotalCapacity(allocator, 512) catch return ExtractError.OutOfMemory;

    var color_it = img.iterator();
    while (color_it.next()) |color| {
        if (color.a < 0.01) continue;

        var found = false;
        for (color_map.items) |*item| {
            if (ColorAndCount.colorSimilar(item.color, color)) {
                item.count += 1;
                found = true;
                break;
            }
        }

        if (!found) {
            color_map.append(allocator, .{
                .color = color,
                .count = 1,
            }) catch return ExtractError.OutOfMemory;
        }
    }

    if (color_map.items.len == 0) {
        return ExtractError.NoColors;
    }

    std.mem.sort(ColorAndCount, color_map.items, {}, ColorAndCount.lessThan);

    const num_colors = @min(max_colors, color_map.items.len);
    const colors = allocator.alloc([]const u8, num_colors) catch return ExtractError.OutOfMemory;
    errdefer {
        for (colors) |c| {
            allocator.free(c);
        }
        allocator.free(colors);
    }

    for (0..num_colors) |i| {
        const c = color_map.items[i].color;
        colors[i] = color_utils.colorf32ToHex(allocator, c.r, c.g, c.b) catch return ExtractError.OutOfMemory;
    }

    return PaletteResult{
        .colors = colors,
        .allocator = allocator,
    };
}

pub const ThemeType = enum {
    vscode,
    zed,
};

pub fn generateThemeJson(
    allocator: std.mem.Allocator,
    colors: []const []const u8,
    theme_type: ThemeType,
    theme_name: []const u8,
) ![]const u8 {
    return switch (theme_type) {
        .vscode => {
            const theme = try vscode.generateVSCodeTheme(allocator, colors);
            return try std.json.Stringify.valueAlloc(allocator, theme, .{ .whitespace = .indent_2 });
        },
        .zed => {
            const theme = try zed.generateZedTheme(allocator, colors, theme_name);
            return try std.json.Stringify.valueAlloc(allocator, theme, .{ .whitespace = .indent_2 });
        },
    };
}

pub fn handleExtractPalette(allocator: std.mem.Allocator, request_body: []const u8, content_type: []const u8) ![]const u8 {
    const boundary = parseBoundary(content_type) orelse return error.InvalidContentType;

    var image_data: ?[]const u8 = null;
    var max_colors: usize = 20;

    var parts_iter = MultipartIterator.init(request_body, boundary);
    while (parts_iter.next()) |part| {
        if (std.mem.indexOf(u8, part.headers, "name=\"file\"") != null or
            std.mem.indexOf(u8, part.headers, "name=\"image\"") != null)
        {
            image_data = part.body;
        } else if (std.mem.indexOf(u8, part.headers, "name=\"maxColors\"") != null) {
            max_colors = std.fmt.parseInt(usize, std.mem.trim(u8, part.body, " \r\n"), 10) catch 20;
        }
    }

    const data = image_data orelse return error.NoImageProvided;

    var result = try extractPaletteFromBytes(allocator, data, max_colors);
    defer result.deinit();

    var json_array = std.ArrayList(u8){};
    errdefer json_array.deinit(allocator);

    try json_array.appendSlice(allocator, "{\"palette\":[");
    for (result.colors, 0..) |color, i| {
        if (i > 0) try json_array.appendSlice(allocator, ",");
        try json_array.appendSlice(allocator, "{\"hex\":\"");
        try json_array.appendSlice(allocator, color);
        try json_array.appendSlice(allocator, "\"}");
    }
    try json_array.appendSlice(allocator, "]}");

    return try json_array.toOwnedSlice(allocator);
}

pub fn handleGenerateTheme(allocator: std.mem.Allocator, request_body: []const u8) ![]const u8 {
    const parsed = try std.json.parseFromSlice(ThemeRequest, allocator, request_body, .{
        .ignore_unknown_fields = true,
    });
    defer parsed.deinit();

    const req = parsed.value;

    if (req.colors.len < 5) {
        return error.NotEnoughColors;
    }

    const colors = try allocator.alloc([]const u8, req.colors.len);
    defer allocator.free(colors);

    for (req.colors, 0..) |c, i| {
        colors[i] = c.hex;
    }

    const theme_type: ThemeType = if (std.mem.eql(u8, req.type, "zed")) .zed else .vscode;
    const theme_name = req.name orelse "Generated Theme";

    return try generateThemeJson(allocator, colors, theme_type, theme_name);
}

const ThemeRequest = struct {
    colors: []const ColorInput,
    type: []const u8,
    name: ?[]const u8 = null,
};

const ColorInput = struct {
    hex: []const u8,
};

fn parseBoundary(content_type: []const u8) ?[]const u8 {
    const boundary_prefix = "boundary=";
    const idx = std.mem.indexOf(u8, content_type, boundary_prefix) orelse return null;
    const start = idx + boundary_prefix.len;
    var end = start;
    while (end < content_type.len and content_type[end] != ';' and content_type[end] != ' ') {
        end += 1;
    }
    return content_type[start..end];
}

const MultipartPart = struct {
    headers: []const u8,
    body: []const u8,
};

const MultipartIterator = struct {
    data: []const u8,
    boundary: []const u8,
    pos: usize,

    pub fn init(data: []const u8, boundary: []const u8) MultipartIterator {
        return .{
            .data = data,
            .boundary = boundary,
            .pos = 0,
        };
    }

    pub fn next(self: *MultipartIterator) ?MultipartPart {
        var full_boundary_buf: [256]u8 = undefined;
        const full_boundary = std.fmt.bufPrint(&full_boundary_buf, "--{s}", .{self.boundary}) catch return null;

        const boundary_start = std.mem.indexOfPos(u8, self.data, self.pos, full_boundary) orelse return null;
        const content_start = boundary_start + full_boundary.len;

        if (content_start >= self.data.len) return null;

        if (self.data.len > content_start + 2 and
            self.data[content_start] == '-' and
            self.data[content_start + 1] == '-')
        {
            return null;
        }

        const next_boundary = std.mem.indexOfPos(u8, self.data, content_start, full_boundary) orelse self.data.len;

        var part_data = self.data[content_start..next_boundary];
        if (part_data.len > 0 and part_data[0] == '\r') part_data = part_data[1..];
        if (part_data.len > 0 and part_data[0] == '\n') part_data = part_data[1..];

        if (part_data.len > 2 and part_data[part_data.len - 2] == '\r' and part_data[part_data.len - 1] == '\n') {
            part_data = part_data[0 .. part_data.len - 2];
        }

        const header_end = std.mem.indexOf(u8, part_data, "\r\n\r\n") orelse {
            self.pos = next_boundary;
            return null;
        };

        self.pos = next_boundary;

        return MultipartPart{
            .headers = part_data[0..header_end],
            .body = part_data[header_end + 4 ..],
        };
    }
};
