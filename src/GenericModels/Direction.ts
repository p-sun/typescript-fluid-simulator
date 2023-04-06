import Vec2 from './Vec2';

export type Direction = `up` | `down` | `left` | `right`;

export function Vec2ForDirection(direction: Direction) {
  switch (direction) {
    case `left`:
      return new Vec2(-1, 0);
    case `right`:
      return new Vec2(1, 0);
    case `up`:
      return new Vec2(0, -1);
    default:
    case `down`:
      return new Vec2(0, 1);
  }
}

export function OppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case `left`:
      return `right`;
    case `right`:
      return `left`;
    case `up`:
      return `down`;
    default:
    case `down`:
      return `up`;
  }
}
