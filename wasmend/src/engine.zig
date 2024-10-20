const std = @import("std");

extern fn consoleLog(val: u32) void;

const allocator = std.heap.wasm_allocator;

const axis_length: usize = 1024;
const wrap_mask: u16 = @truncate(axis_length - 1);
const num_cells: usize = axis_length * axis_length;

const AliveCell = packed struct {
    x: u16,
    y: u16,
    colour: u32,
    fn copy(self: *AliveCell, other: *const AliveCell) void {
        self.x = other.x;
        self.y = other.y;
        self.colour = other.colour;
    }
    fn set(self: *AliveCell, x: u16, y: u16, colour: u32) void {
        self.x = x;
        self.y = y;
        self.colour = colour;
    }
};

const CellCandidate = struct {
    x: u16,
    y: u16,
    colour: u32,
    alive: bool,
    alive_neighbours: [3]AliveCell,
    count: u4,
    fn addNeighbour(self: *CellCandidate, neighbour: *const AliveCell) void {
        if (self.count < 3) {
            self.alive_neighbours[self.count].copy(neighbour);
        }
        self.count += 1;
    }
    fn create(self: *CellCandidate) void {
        var n_0 = self.alive_neighbours[0];
        var n_1 = self.alive_neighbours[1];
        var n_2 = self.alive_neighbours[2];

        // sort clockwise
        if (n_0.x < n_1.x or n_0.y < n_1.y) {
            if (n_2.x < n_0.x or n_2.y < n_0.y) {
                n_0 = self.alive_neighbours[2];
                n_1 = self.alive_neighbours[0];
                n_2 = self.alive_neighbours[1];
            } else if (n_2.x < n_1.x or n_2.y < n_1.y) {
                n_1 = self.alive_neighbours[2];
                n_2 = self.alive_neighbours[1];
            }
        } else {
            if (n_0.x < n_2.x or n_0.y < n_2.y) {
                n_0 = self.alive_neighbours[1];
                n_1 = self.alive_neighbours[0];
                n_2 = self.alive_neighbours[2];
            } else if (n_1.x < n_2.x or n_1.y < n_2.y) {
                n_0 = self.alive_neighbours[1];
                n_1 = self.alive_neighbours[2];
                n_2 = self.alive_neighbours[0];
            } else {
                n_0 = self.alive_neighbours[2];
                n_2 = self.alive_neighbours[0];
            }
        }

        self.colour = (n_0.colour & 0xff0000) | (n_1.colour & 0x00ff00) | (n_2.colour & 0x0000ff);
    }
};

var output_buffer = std.mem.zeroes([num_cells]AliveCell);
var candidates = std.AutoArrayHashMap(u32, CellCandidate).init(allocator);

export fn init() [*]u32 {
    for (0..num_cells) |i| {
        candidates.put(@truncate(i), undefined) catch continue;
    }
    candidates.clearRetainingCapacity();
    return @ptrCast(&output_buffer);
}

export fn axisLength() usize {
    return axis_length;
}

export fn clear() void {
    @memset(&output_buffer, .{ .x = 0, .y = 0, .colour = 0 });
}

export fn fillRandomly(seed: u64) u32 {
    clear();

    var prng = std.rand.DefaultPrng.init(seed);
    const rand = prng.random();

    var num_alive: u32 = 0;
    for (0..axis_length) |x| {
        for (0..axis_length) |y| {
            if (rand.boolean()) {
                continue;
            }
            const colour = rand.uintLessThan(u32, 0xffffff);
            output_buffer[num_alive].set(@truncate(x), @truncate(y), colour);
            num_alive += 1;
        }
    }
    return num_alive;
}

fn makeCoord(x: u16, y: u16) u32 {
    return (@as(u32, x) << 16) | y;
}

fn setCellAsCandidate(cell: *const AliveCell) void {
    const coord = makeCoord(cell.x, cell.y);
    const cand_opt = candidates.getPtr(coord);
    if (cand_opt) |cand| {
        cand.alive = true;
        cand.colour = cell.colour;
        return;
    }

    candidates.putAssumeCapacity(coord, CellCandidate{ .x = cell.x, .y = cell.y, .colour = cell.colour, .count = 0, .alive = true, .alive_neighbours = undefined });
}

fn setNeighbourAsCandidate(cell: *const AliveCell, x: u16, y: u16) void {
    const coord = makeCoord(x, y);
    const cand_opt = candidates.getPtr(coord);
    if (cand_opt) |cand| {
        cand.addNeighbour(cell);
        return;
    }
    var alive_neighbours: [3]AliveCell = undefined;
    alive_neighbours[0].copy(cell);
    candidates.putAssumeCapacity(coord, CellCandidate{ .x = x, .y = y, .colour = 0, .count = 1, .alive = false, .alive_neighbours = alive_neighbours });
}

export fn calcNextGen(length: u32) u32 {
    var num_alive: u32 = 0;
    for (output_buffer[0..length]) |cell| {
        const x = cell.x;
        const x_left = (x -% 1) & wrap_mask;
        const x_right = (x + 1) & wrap_mask;

        const y = cell.y;
        const y_up = (y -% 1) & wrap_mask;
        const y_down = (y + 1) & wrap_mask;

        setNeighbourAsCandidate(&cell, x_left, y_up);
        setNeighbourAsCandidate(&cell, x, y_up);
        setNeighbourAsCandidate(&cell, x_right, y_up);

        setNeighbourAsCandidate(&cell, x_left, y);
        setCellAsCandidate(&cell);
        setNeighbourAsCandidate(&cell, x_right, y);

        setNeighbourAsCandidate(&cell, x_left, y_down);
        setNeighbourAsCandidate(&cell, x, y_down);
        setNeighbourAsCandidate(&cell, x_right, y_down);
    }

    var iter = candidates.iterator();
    while (iter.next()) |e| {
        var cand = e.value_ptr;
        if (cand.count < 2 or cand.count > 3) {
            continue;
        }

        if (!cand.alive) {
            if (cand.count == 2) {
                continue;
            }
            cand.create();
        }

        output_buffer[num_alive].set(cand.x, cand.y, cand.colour);
        num_alive += 1;
    }
    candidates.clearRetainingCapacity();
    return num_alive;
}
