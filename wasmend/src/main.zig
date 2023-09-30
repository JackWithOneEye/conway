const std = @import("std");

pub fn main() !void {
    // Prints to stderr (it's a shortcut based on `std.io.getStdErr()`)
    std.debug.print("All your {s} are belong to us.\n", .{"codebase"});

    const x: u32 = 69;
    const y: u32 = 42;
    const r: u32 = 1;
    const g: u32 = 2;
    const b: u32 = 3;

    const foo: u56 = @as(u56, x) << 40 | y << 24 | r << 16 | g << 8 | b;

    std.debug.print(("{d}\n"), .{foo});

    const xa = foo >> 40;
    const ya = (foo >> 24) & 0xff;
    const ra = (foo >> 16) & 0xff;
    const ga = (foo >> 8) & 0xff;
    const ba = (foo) & 0xff;
    std.debug.print(("{d} {d} {d} {d} {d}\n"), .{ xa, ya, ra, ga, ba });
    // stdout is for the actual output of your application, for example if you
    // are implementing gzip, then only the compressed bytes should be sent to
    // stdout, not any debugging messages.
    const stdout_file = std.io.getStdOut().writer();
    var bw = std.io.bufferedWriter(stdout_file);
    const stdout = bw.writer();

    try stdout.print("Run `zig build test` to run the tests.\n", .{});

    try bw.flush(); // don't forget to flush!
}

test "simple test" {
    var list = std.ArrayList(i32).init(std.testing.allocator);
    defer list.deinit(); // try commenting this out and see if zig detects the memory leak!
    try list.append(42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}
