import Color from '../GenericModels/Color';
import { Direction } from '../GenericModels/Direction';
import Vec2 from '../GenericModels/Vec2';

export type TextAttributes = {
  color: Color;
  fontSize: number;
};

export type CanvasKeyEvent =
  | { key: 'space' }
  | { key: 'backspace' }
  | { key: 'arrow'; direction: Direction }
  | { key: 'letter'; letter: 'E' | 'M' | 'H' }
  | { key: 'digit'; digit: number };

export type CanvasMouseEvent =
  | { mode: 'move' }
  | { mode: 'boundary'; boundary: 'enter' | 'exit' }
  | { mode: 'button'; state: 'up' | 'down'; button: 'primary' | 'secondary' };

export type LineOptions = {
  start: Vec2;
  end: Vec2;
  color: Color;
  thickness?: number;
  lineDash?: number[];
};

export type EllipseOptions = {
  origin: Vec2;
  rx: number;
  ry: number;
  color: Color;
  rotationAngle?: number;
};

export type RectOptions = {
  origin: Vec2;
  size: Vec2;
  color: Color;
  alpha?: number;
};

export type TextOptions = {
  text: string;
  position: Vec2;
  attributes: TextAttributes;
  normalizedAnchorOffset?: {
    offsetX?: number;
    offsetY?: number | 'baseline';
  };
  background?: { color: Color; alpha?: number; padding?: number };
};

export interface ICanvas {
  get size(): Vec2;
  set size(newSize: Vec2);
  get midpoint(): Vec2;

  // Math
  fromNormalizedCoordinate(coord: Vec2): Vec2;
  toNormalizedCoordinate(pos: Vec2): Vec2;
  toNormalizedCoordinate(pos: Vec2): Vec2;
  measureText(
    contents: string,
    attributes: TextAttributes
  ): { size: Vec2; baselineOffsetFromBottom: number };

  // Drawing
  clear(color: Color): void;
  drawRect(options: RectOptions): void;
  drawLine(options: LineOptions): void;
  drawEllipse(options: EllipseOptions): void;
  drawText(options: TextOptions): void;
  drawTextAtPosition(
    contents: string,
    position: Vec2,
    attributes: TextAttributes,
    normalizedAnchorOffset?: {
      normalizedOffsetX?: number;
      normalizedOffsetY?: number | 'baseline';
    },
    background?: { color: Color; alpha?: number; padding?: number }
  ): void;

  // Listen for Input
  setKeyDownListener(fn: (key: CanvasKeyEvent) => void): void;
  unsetKeyDownListener(): void;
  setMouseListener(fn: (event: CanvasMouseEvent, pos: Vec2) => void): void;
  unsetMouseListener(): void;
}
