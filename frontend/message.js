export const MessageIndex = /** @type {const} */ ({
  UPDATE: 0,
  TYPE: 1,

  RESIZE_HEIGHT: 2,
  RESIZE_WIDTH: 3,

  CONTROL_CMD: 4,

  CELL_SIZE: 5,

  SPEED: 6,

  DRAG_X: 7,
  DRAG_Y: 8,

  CLICK_X: 9,
  CLICK_Y: 10,
  CLICK_COLOUR: 11,

  DROP_X: 12,
  DROP_Y: 13,
  DROP_COLOUR: 14,
  DROP_PATTERN_LEN: 15,
  DROP_PATTERN: 16
  // drop pattern from here
});



export const MessageType = /** @type {const} */ ({
  RESIZE: 1,
  CONTROL: 2,
  CELL_SIZE_CHANGE: 4,
  SPEED_CHANGE: 8,
  CANVAS_ON_DRAG: 16,
  CANVAS_ON_CLICK: 32,
  CANVAS_ON_DROP: 64,
  CLEAR: 128,
});

export const Command = /** @type {const} */ ({
  NEXT: 0,
  PLAY: 1,
  STOP: 2,
});