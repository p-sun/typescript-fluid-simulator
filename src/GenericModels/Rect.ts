import Vec2 from './Vec2';

export default class Rect {
  constructor(public readonly origin: Vec2, public readonly size: Vec2) {}

  convertNormalizedPosition(pos: Vec2): Vec2 {
    return this.origin.add(pos.componentMul(this.size));
  }

  get midpoint(): Vec2 {
    return this.convertNormalizedPosition(new Vec2(0.5, 0.5));
  }

  get minX() {
    return this.origin.x;
  }

  get minY() {
    return this.origin.y;
  }

  get maxX() {
    return this.origin.x + this.size.x;
  }

  get maxY() {
    return this.origin.y + this.size.y;
  }

  contains(point: Vec2) {
    return (
      point.x >= this.minX &&
      point.y >= this.minY &&
      point.x < this.maxX &&
      point.y < this.maxY
    );
  }
}
