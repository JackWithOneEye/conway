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
});

export const MessageType = /** @type {const} */ ({
  RESIZE: 1,
  CONTROL: 2,
  CELL_SIZE_CHANGE: 4,
  SPEED_CHANGE: 8,
  CANVAS_ON_DRAG: 16,
  CANVAS_ONCLICK: 32,
});

export const Command = /** @type {const} */ ({
  NEXT: 0,
  PLAY: 1,
  STOP: 2,
});