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

const CellNeighbour = struct {
    x: u16,
    y: u16,
    colour: u32,
    alive_neighbours: [3]AliveCell,
    count: u4,
    survivor: bool,
    fn new(cell: *const AliveCell, x: u16, y: u16) CellNeighbour {
        var cn = CellNeighbour{ .x = x, .y = y, .colour = 0, .count = 1, .survivor = false, .alive_neighbours = undefined };
        cn.alive_neighbours[0].copy(cell);
        return cn;
    }
    fn increment(self: *CellNeighbour, neighbour: *const AliveCell) void {
        if (self.count < 3) {
            self.alive_neighbours[self.count].copy(neighbour);
        }
        self.count += 1;
    }
    fn survive(self: *CellNeighbour, colour: u32) void {
        if (self.count == 2) {
            self.count += 1;
        }
        self.colour = colour;
        self.survivor = true;
    }
    fn create(self: *CellNeighbour) void {
        var n_0 = self.alive_neighbours[0];
        var n_1 = self.alive_neighbours[1];
        var n_2 = self.alive_neighbours[2];

        // sort
        if (n_0.x < n_1.x or n_0.y < n_1.y) {
            if (n_1.x < n_2.x or n_1.y < n_2.y) {
                // nothing
            } else if (n_0.x < n_2.x or n_0.y < n_2.y) {
                n_1 = self.alive_neighbours[2];
                n_2 = self.alive_neighbours[1];
            } else {
                n_0 = self.alive_neighbours[2];
                n_1 = self.alive_neighbours[0];
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
var neighbours = std.AutoArrayHashMap(u32, CellNeighbour).init(allocator);

export fn init() [*]u32 {
    for (0..num_cells) |i| {
        neighbours.put(@truncate(i), undefined) catch continue;
    }
    neighbours.clearRetainingCapacity();
    return @ptrCast(&output_buffer);
}

export fn axisLength() usize {
    return axis_length;
}

fn makeCoord(x: u16, y: u16) u32 {
    return (@as(u32, x) << 16) | y;
}

fn setNeighbour(cell: *const AliveCell, x: u16, y: u16) void {
    const coord = makeCoord(x, y);
    const n_opt = neighbours.getPtr(coord);
    if (n_opt) |n| {
        n.increment(cell);
        return;
    }
    neighbours.putAssumeCapacity(coord, CellNeighbour.new(cell, x, y));
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

        setNeighbour(&cell, x_left, y_up);
        setNeighbour(&cell, x, y_up);
        setNeighbour(&cell, x_right, y_up);

        setNeighbour(&cell, x_left, y);
        setNeighbour(&cell, x_right, y);

        setNeighbour(&cell, x_left, y_down);
        setNeighbour(&cell, x, y_down);
        setNeighbour(&cell, x_right, y_down);
    }

    for (output_buffer[0..length]) |cell| {
        const coord = makeCoord(cell.x, cell.y);
        const n_opt = neighbours.getPtr(coord);
        if (n_opt) |n| {
            const cnt = n.count;
            if (cnt == 2 or cnt == 3) {
                n.survive(cell.colour);
            }
        }
    }

    var iter = neighbours.iterator();
    while (iter.next()) |neighbour| {
        var n = neighbour.value_ptr;
        if (n.count == 3) {
            if (!n.survivor) {
                n.create();
            }
            output_buffer[num_alive].set(n.x, n.y, n.colour);
            num_alive += 1;
        }
    }
    neighbours.clearRetainingCapacity();
    return num_alive;
}
