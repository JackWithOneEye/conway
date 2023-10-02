open Tyxml;

module GameOfLife = {
  let createElement = (~cell_size, ~cell_colour, ~speed, ()) =>
    (Html.Unsafe.node("game-of-life"))(
      ~a=[
        Html.a_class([
          "w-full bg-gray-100 border border-gray-50 rounded-lg shadow flex-1 flex flex-col",
        ]),
        Html.Unsafe.int_attrib("cell-size", cell_size),
        Html.Unsafe.int_attrib("cell-colour", cell_colour),
        Html.Unsafe.float_attrib("speed", speed),
      ],
      [],
    );
};
