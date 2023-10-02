const std = @import("std");

extern fn consoleLog(val: u32) void;

const allocator = std.heap.wasm_allocator;

const axis_length: usize = 128;
const wrap_mask: u16 = @truncate(axis_length - 1);
const num_cells = axis_length * axis_length;

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
    count: u3,
    survivor: bool,
    fn init(self: *CellNeighbour, cell: *const AliveCell, x: u16, y: u16) void {
        self.x = x;
        self.y = y;
        self.colour = 0;
        self.count = 1;
        self.survivor = false;
        self.alive_neighbours[0].copy(cell);
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

        if (self.colour == 0xffffff) {
            self.colour = 0;
        }
    }
};

var output_buffer = std.mem.zeroes([num_cells]AliveCell);
var neighbours = std.ArrayList(CellNeighbour).init(allocator);

export fn init() [*]u32 {
    _ = neighbours.addManyAsArray(num_cells) catch unreachable;
    return @ptrCast(&output_buffer);
}

export fn axisLength() usize {
    return axis_length;
}

fn setNeighbour(cell: *const AliveCell, x: u16, y: u16, colour: u32, num_neighbours: u16) u16 {
    _ = colour;
    for (neighbours.items[0..num_neighbours]) |*n| {
        if (n.x == x and n.y == y) {
            n.increment(cell);
            return num_neighbours;
        }
    }
    neighbours.items[num_neighbours].init(cell, x, y);
    return num_neighbours + 1;
}

export fn calcNextGen(length: u32) u32 {
    var num_alive: u32 = 0;
    var num_neighbours: u16 = 0;
    for (output_buffer[0..length]) |cell| {
        const x = cell.x;
        var x_left = wrap_mask;
        if (x > 0) {
            x_left = x - 1;
        }
        const x_right = (x + 1) & wrap_mask;

        const y = cell.y;
        var y_up = wrap_mask;
        if (y > 0) {
            y_up = y - 1;
        }
        const y_down = (y + 1) & wrap_mask;

        num_neighbours = setNeighbour(&cell, x_left, y_up, cell.colour, num_neighbours);
        num_neighbours = setNeighbour(&cell, x, y_up, cell.colour, num_neighbours);
        num_neighbours = setNeighbour(&cell, x_right, y_up, cell.colour, num_neighbours);

        num_neighbours = setNeighbour(&cell, x_left, y, cell.colour, num_neighbours);
        num_neighbours = setNeighbour(&cell, x_right, y, cell.colour, num_neighbours);

        num_neighbours = setNeighbour(&cell, x_left, y_down, cell.colour, num_neighbours);
        num_neighbours = setNeighbour(&cell, x, y_down, cell.colour, num_neighbours);
        num_neighbours = setNeighbour(&cell, x_right, y_down, cell.colour, num_neighbours);
    }

    for (output_buffer[0..length]) |cell| {
        for (neighbours.items[0..num_neighbours]) |*neighbour| {
            const cnt = neighbour.count;
            if ((cnt == 2 or cnt == 3) and neighbour.x == cell.x and neighbour.y == cell.y) {
                neighbour.survive(cell.colour);
            }
        }
    }

    for (neighbours.items[0..num_neighbours]) |*neighbour| {
        if (neighbour.count == 3) {
            if (!neighbour.survivor) {
                neighbour.create();
            }
            output_buffer[num_alive].set(neighbour.x, neighbour.y, neighbour.colour);
            num_alive += 1;
        }
    }
    return num_alive;
}
