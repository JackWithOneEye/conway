module GameOfLife = {
  open Tyxml.Html;
  let createElement = (~cell_size, ~cell_colour, ~speed, ()) =>
    (Unsafe.node("game-of-life"))(
      ~a=[
        a_class(["contents"]),
        Unsafe.int_attrib("cell-size", cell_size),
        Unsafe.int_attrib("cell-colour", cell_colour),
        Unsafe.float_attrib("speed", speed),
      ],
      [],
    );
};
