const std = @import("std");

const allocator = std.heap.wasm_allocator;

const axis_length: usize = 32;
const wrap_mask = axis_length - 1;
const num_cells = axis_length * axis_length;

var output_buffer = std.mem.zeroes([num_cells]u32);

var alive_cells = std.AutoHashMap(u32, u2).init(allocator);

export fn init() [*]u32 {
    for (0..num_cells) |i| {
        alive_cells.put(i, 0) catch continue;
    }
    return @ptrCast(&output_buffer);
}

export fn axisLength() usize {
    return axis_length;
}

export fn calcNextGen(length: u32) u32 {
    alive_cells.clearRetainingCapacity();
    for (output_buffer[0..length]) |cell| {
        alive_cells.put(cell, 1) catch continue;
    }
    var num_alive: u32 = 0;
    for (0..axis_length) |y| {
        var y_up = wrap_mask;
        if (y > 0) {
            y_up = y - 1;
        }
        const y_down = (y + 1) & wrap_mask;

        for (0..axis_length) |x| {
            var x_left = wrap_mask;
            if (x > 0) {
                x_left = x - 1;
            }
            const x_right = (x + 1) & wrap_mask;

            var num_alive_neighbours: u8 = (alive_cells.get(x_left << 16 | y_up) orelse 0) +
                (alive_cells.get(x << 16 | y_up) orelse 0) +
                (alive_cells.get(x_right << 16 | y_up) orelse 0);

            num_alive_neighbours += (alive_cells.get(x_left << 16 | y) orelse 0) +
                (alive_cells.get(x_right << 16 | y) orelse 0);

            num_alive_neighbours += (alive_cells.get(x_left << 16 | y_down) orelse 0) +
                (alive_cells.get(x << 16 | y_down) orelse 0) +
                (alive_cells.get(x_right << 16 | y_down) orelse 0);

            if (num_alive_neighbours == 3 or (num_alive_neighbours == 2 and alive_cells.contains(x << 16 | y))) {
                output_buffer[num_alive] = x << 16 | y;
                num_alive += 1;
            }
        }
    }
    return num_alive;
}
