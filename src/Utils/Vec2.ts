export default class Vec2 {
  constructor(public readonly x: number, public readonly y: number = x) {}

  static readonly zero = new Vec2(0, 0);
  static readonly one = new Vec2(1, 1);
  static readonly x = new Vec2(1, 0);
  static readonly y = new Vec2(0, 1);

  static readonly left = new Vec2(-1, 0);
  static readonly right = new Vec2(1, 0);
  static readonly up = new Vec2(0, 1);
  static readonly down = new Vec2(0, -1);

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vec2 {
    return scalar === 0
      ? Vec2.zero
      : new Vec2(this.x / scalar, this.y / scalar);
  }

  componentMul(other: Vec2): Vec2 {
    return new Vec2(this.x * other.x, this.y * other.y);
  }

  componentDiv(other: Vec2): Vec2 {
    return new Vec2(
      other.x === 0 ? 0 : this.x / other.x,
      other.y === 0 ? 0 : this.y / other.y
    );
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  magnitudeSquared(): number {
    return this.dot(this);
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  normalized(): Vec2 {
    return this.div(this.magnitude());
  }

  lerp(other: Vec2, amount: number): Vec2 {
    return this.add(other.sub(this).mul(amount));
  }

  lerp2(other: Vec2, amountX: number, amountY: number): Vec2 {
    return new Vec2(
      this.x + (other.x - this.x) * amountX,
      this.y + (other.y - this.y) * amountY
    );
  }

  toString() {
    return `(x: ${this.x}, y: ${this.y})`;
  }

  mapX(fn: (n: number) => number): Vec2 {
    return new Vec2(fn(this.x), this.y);
  }

  mapY(fn: (n: number) => number): Vec2 {
    return new Vec2(this.x, fn(this.y));
  }

  rotate(angleRad: number): Vec2 {
    const { x, y } = this;

    const s = Math.sin(angleRad);
    const c = Math.cos(angleRad);

    return new Vec2(c * x + s * y, -s * x + c * y);
  }

  polarAngleRad(): number {
    return Math.atan2(this.y, this.x);
  }

  cosAnlgeRadTo(other: Vec2): number {
    return this.normalized().dot(other.normalized());
  }

  sinAnlgeRadTo(other: Vec2): number {
    return this.x * other.y - this.y * other.x; // z-component of the cross product
  }

  unsignedAnlgeRadTo(other: Vec2): number {
    return Math.acos(this.cosAnlgeRadTo(other));
  }

  signedAngleRadTo(other: Vec2): number {
    return Math.atan2(this.sinAnlgeRadTo(other), this.cosAnlgeRadTo(other));
  }

  mapComponents(fn: (value: number, component: 'x' | 'y') => number): Vec2 {
    return new Vec2(fn(this.x, 'x'), fn(this.y, 'y'));
  }

  roundToIntegers(): Vec2 {
    return this.mapComponents((n) => Math.round(n));
  }

  static max(...vecs: Vec2[]): Vec2 {
    if (vecs.length === 0) {
      return Vec2.zero;
    }

    let [{ x, y }, ...tail] = vecs;

    for (const v of tail) {
      x = Math.max(x, v.x);
      y = Math.max(y, v.y);
    }

    return new Vec2(x, y);
  }
}
