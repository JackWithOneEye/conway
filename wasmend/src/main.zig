const std = @import("std");

const Foo = struct { bar: u16, baz: f64 };

fn print(ptr: *const Foo) void {
    std.debug.print("!!! {}\n", .{ptr.*});
}

pub fn main() !void {
    // Prints to stderr (it's a shortcut based on `std.io.getStdErr()`)
    std.debug.print("All your {s} are belong to us.\n", .{"codebase"});

    const x: u16 = 0;
    const x_left = (x -% 1) & 511;
    const undef: Foo = undefined;
    const undef_ptr: *Foo = undefined;
    // undef_ptr = &undef;
    print(undef_ptr);
    std.debug.print("{} {} {} {}\n", .{ x, x_left, undef, undef_ptr });

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
