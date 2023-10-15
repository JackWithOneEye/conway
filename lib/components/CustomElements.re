module GameOfLife = {
  open Tyxml.Html;
  let createElement = (~cell_size, ~cell_colour, ~speed, ()) =>
    (Unsafe.node("game-of-life"))(
      ~a=[
        a_class([
          "w-full bg-gray-100 border border-gray-50 rounded-lg shadow flex-1 flex flex-col overflow-hidden",
        ]),
        Unsafe.int_attrib("cell-size", cell_size),
        Unsafe.int_attrib("cell-colour", cell_colour),
        Unsafe.float_attrib("speed", speed),
      ],
      [],
    );
};
