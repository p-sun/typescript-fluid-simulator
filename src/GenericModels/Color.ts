import { clamp } from '../GenericGame/Utils';

export default class Color {
  constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number
  ) {}

  static grey(value: number = 0.5) {
    return new Color(value, value, value);
  }

  static readonly white = Color.grey(1);
  static readonly black = Color.grey(0);
  static readonly red = new Color(1, 0, 0);
  static readonly orange = new Color(1, 0.5, 0);
  static readonly yellow = new Color(1, 1, 0);
  static readonly green = new Color(0, 1, 0);
  static readonly cyan = new Color(0, 1, 1);
  static readonly blue = new Color(0, 0, 1);
  static readonly magenta = new Color(1, 0, 1);

  // Usage: Color.fromHex(0x81b29a)
  static fromHex(hex: number): Color {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return new Color(r / 255, g / 255, b / 255);
  }

  asHexString(): string {
    function hexComponentString(n: number): string {
      const s = Math.floor(clamp(n, { min: 0, max: 1 }) * 255).toString(16);
      return s.length < 2 ? '0' + s : s;
    }

    return `#${hexComponentString(this.r)}${hexComponentString(
      this.g
    )}${hexComponentString(this.b)}`;
  }

  add(other: Color): Color {
    return new Color(this.r + other.r, this.g + other.g, this.b + other.b);
  }

  sub(other: Color): Color {
    return new Color(this.r - other.r, this.g - other.g, this.b - other.b);
  }

  mul(scalar: number): Color {
    return new Color(this.r * scalar, this.g * scalar, this.b * scalar);
  }

  div(scalar: number): Color {
    return scalar === 0
      ? Color.black
      : new Color(this.r / scalar, this.g / scalar, this.b / scalar);
  }

  lerp(other: Color, amount: number): Color {
    return this.add(other.sub(this).mul(amount));
  }

  toString() {
    return `(r: ${this.r}, g: ${this.g}, b: ${this.b})`;
  }

  toHSV(): { hue: number; saturation: number; value: number } {
    const max = Math.max(this.r, this.g, this.b);
    const min = Math.min(this.r, this.g, this.b);
    const delta = max - min;

    const { r, g, b } = this;

    const hue =
      delta === 0
        ? 0
        : max === r
        ? (((g - b) / delta) % 6) / 6
        : max === g
        ? ((b - r) / delta + 2) / 6
        : ((r - g) / delta + 4) / 6;

    const saturation = max === 0 ? 0 : delta / max;
    const value = delta;

    return { hue, saturation, value };
  }

  static fromHSV(hue: number, saturation: number, value: number) {
    const h = hue * 6;
    const c = value * saturation;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = value - c;

    const [r, g, b] =
      h < 1
        ? [c, x, 0]
        : h < 2
        ? [x, c, 0]
        : h < 3
        ? [0, c, x]
        : h < 4
        ? [0, x, c]
        : h < 5
        ? [x, 0, c]
        : [c, 0, x];

    return new Color(r + m, g + m, b + m);
  }
}
