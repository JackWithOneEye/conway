const std = @import("std");

const allocator = std.heap.wasm_allocator;

export fn mallocu32(length: usize) ?[*]u32 {
    const buff = allocator.alloc(u32, length) catch return null;
    return buff.ptr;
}

export fn next(input: [*]const u32, length: u32, output: [*]u32) u32 {
    var num_alive: u32 = 0;
    for (input[0..length], 0..) |cell, i| {
        var x = cell >> 16;
        var y = cell & 0x00ff;
        output[i] = ((x + 1) << 16) | y;
        num_alive += 1;
    }
    return num_alive;
}
