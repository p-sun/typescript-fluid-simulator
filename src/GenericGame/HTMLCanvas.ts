import Color from '../GenericModels/Color';
import Vec2 from '../GenericModels/Vec2';
import {
  ICanvas,
  TextAttributes,
  RectOptions,
  EllipseOptions,
  LineOptions,
  TextOptions,
  CanvasKeyEvent,
  CanvasMouseEvent,
} from './ICanvas';

export default class HTMLCanvas implements ICanvas {
  #context: CanvasRenderingContext2D;
  #size: Vec2;
  #canvasElement: HTMLCanvasElement;

  constructor(canvasElement: HTMLCanvasElement, size: Vec2) {
    this.#canvasElement = canvasElement;
    this.#context = canvasElement.getContext('2d') as CanvasRenderingContext2D;
    this.#size = size;
  }

  get size(): Vec2 {
    return this.#size;
  }

  set size(newSize: Vec2) {
    this.#size = newSize;

    this.#canvasElement.style.width = newSize.x + 'px';
    this.#canvasElement.style.height = newSize.y + 'px';

    const scale = window.devicePixelRatio;
    this.#canvasElement.width = newSize.x * scale;
    this.#canvasElement.height = newSize.y * scale;

    this.#context.scale(scale, scale);
  }

  static createInRootElement(
    rootElement: Element,
    size: Vec2 = Vec2.zero
  ): HTMLCanvas {
    const canvasElement = document.createElement('canvas') as HTMLCanvasElement;
    rootElement.appendChild(canvasElement);
    return new HTMLCanvas(canvasElement, size);
  }

  get midpoint(): Vec2 {
    return this.fromNormalizedCoordinate(new Vec2(0.5, 0.5));
  }

  fromNormalizedCoordinate(coord: Vec2): Vec2 {
    return this.size.componentMul(coord);
  }

  toNormalizedCoordinate(pos: Vec2): Vec2 {
    return pos.componentDiv(this.size);
  }

  clear(color: Color) {
    this.drawRect({ origin: Vec2.zero, size: this.size, color });
  }

  measureText(
    contents: string,
    attributes: TextAttributes
  ): { size: Vec2; baselineOffsetFromBottom: number } {
    return this.#performCanvasTextOperation(attributes, () => {
      return this.#measureTextWithContextReady(contents);
    });
  }

  drawRect(options: RectOptions) {
    const { color, origin, size, alpha } = options;
    this.#context.fillStyle = color.asHexString();

    const globalAlpga = this.#context.globalAlpha;
    if (alpha !== undefined) {
      this.#context.globalAlpha = alpha;
    }
    this.#context.fillRect(origin.x, origin.y, size.x, size.y);
    this.#context.globalAlpha = globalAlpga;
  }

  drawEllipse(options: EllipseOptions) {
    const { color, origin, rx, ry, rotationAngle } = options;
    this.#context.fillStyle = color.asHexString();
    this.#context.beginPath();
    this.#context.ellipse(
      origin.x,
      origin.y,
      rx,
      ry,
      rotationAngle ?? 0,
      2 * Math.PI,
      0
    );
    this.#context.fill();
  }

  drawLine(options: LineOptions) {
    this.#context.strokeStyle = options.color.asHexString();
    this.#context.lineWidth = options.thickness ?? 1;
    this.#context.setLineDash(options.lineDash ?? []);

    this.#context.beginPath();
    this.#context.moveTo(options.start.x, options.start.y);
    this.#context.lineTo(options.end.x, options.end.y);
    this.#context.stroke();
  }

  drawText(options: TextOptions) {
    this.#performCanvasTextOperation(options.attributes, () => {
      let { x, y } = options.position;
      if (options.normalizedAnchorOffset) {
        const offsetX = options.normalizedAnchorOffset?.offsetX ?? 0;
        const offsetY = options.normalizedAnchorOffset?.offsetY ?? 'baseline';
        const measure = this.#measureTextWithContextReady(options.text);
        x += (-measure.size.x / 2) * (1 + offsetX);

        if (offsetY === 'baseline') {
          y -= measure.baselineOffsetFromBottom;
        } else {
          y +=
            (measure.size.y / 2) * (1 - offsetY) -
            measure.baselineOffsetFromBottom;
        }
      }

      let { background } = options;
      if (background) {
        this.#context.save();

        if (background.alpha !== undefined) {
          this.#context.globalAlpha = background.alpha;
        }

        const measure = this.#measureTextWithContextReady(options.text);
        let p = new Vec2(x, y).mapY((y) => y - measure.size.y);
        let s = measure.size;

        if (background.padding) {
          const offset = new Vec2(background.padding);
          p = p.sub(offset);
          s = s.add(offset.mul(2));
        }

        this.drawRect({ origin: p, size: s, color: background.color });
        this.#context.restore();
      }

      this.#context.fillText(options.text, x, y);
    });
  }

  drawTextAtPosition(
    contents: string,
    position: Vec2,
    attributes: TextAttributes,
    normalizedAnchorOffset: {
      normalizedOffsetX?: number;
      normalizedOffsetY?: number | 'baseline';
    } = { normalizedOffsetX: 0, normalizedOffsetY: 0 },
    background?: { color: Color; alpha?: number; padding?: number }
  ) {
    this.#performCanvasTextOperation(attributes, () => {
      let { x, y } = position;

      const measure = this.#measureTextWithContextReady(contents);

      if (normalizedAnchorOffset) {
        if (normalizedAnchorOffset.normalizedOffsetX !== undefined) {
          x +=
            (-measure.size.x / 2) *
            (1 + normalizedAnchorOffset.normalizedOffsetX);
        }

        if (normalizedAnchorOffset.normalizedOffsetY !== undefined) {
          if (normalizedAnchorOffset.normalizedOffsetY === 'baseline') {
            y += measure.baselineOffsetFromBottom;
          } else {
            y +=
              (measure.size.y / 2) *
              (1 - normalizedAnchorOffset.normalizedOffsetY);
          }
        }
      }

      if (background) {
        this.#context.save();

        if (background.alpha !== undefined) {
          this.#context.globalAlpha = background.alpha;
        }

        let p = new Vec2(x, y).mapY((y) => y - measure.size.y);
        let s = measure.size;

        if (background.padding) {
          const offset = new Vec2(background.padding);
          p = p.sub(offset);
          s = s.add(offset.mul(2));
        }

        this.drawRect({ origin: p, size: s, color: background.color });

        this.#context.restore();
      }

      this.#context.fillText(contents, x, y);
    });
  }

  #performCanvasTextOperation<T = undefined>(
    attributes: TextAttributes,
    op: () => T
  ) {
    this.#context.save();
    this.#context.font = `${attributes.fontSize}px Monoco`;
    this.#context.fillStyle = attributes.color.asHexString();
    const res = op();
    this.#context.restore();

    return res;
  }

  #measureTextWithContextReady(contents: string): {
    size: Vec2;
    baselineOffsetFromBottom: number;
  } {
    const metrics = this.#context.measureText(contents);
    return {
      size: new Vec2(
        metrics.width,
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      ),
      baselineOffsetFromBottom: metrics.actualBoundingBoxDescent,
    };
  }

  #keyboardListener: ((evt: CanvasKeyEvent) => void) | undefined = undefined;
  #_keyboardListener: ((evt: KeyboardEvent) => void) | undefined = undefined;

  setKeyDownListener(fn: (key: CanvasKeyEvent) => void) {
    this.unsetKeyDownListener();

    this.#keyboardListener = fn;
    this.#_keyboardListener = (key) => {
      this.#canvasKeyboardListener(key);
    };
    window.addEventListener('keydown', this.#_keyboardListener);
  }

  unsetKeyDownListener() {
    if (this.#_keyboardListener) {
      window.removeEventListener('keydown', this.#_keyboardListener);
      this.#_keyboardListener = undefined;
      this.#keyboardListener = undefined;
    }
  }

  #canvasKeyboardListener(event: KeyboardEvent) {
    const listener = this.#keyboardListener;
    if (!listener) {
      return;
    }

    const { key, code } = event;
    if (key === 'ArrowUp') {
      listener({ key: 'arrow', direction: `up` });
    } else if (key === 'ArrowDown') {
      listener({ key: 'arrow', direction: `down` });
    } else if (key === 'ArrowLeft') {
      listener({ key: 'arrow', direction: `left` });
    } else if (key === 'ArrowRight') {
      listener({ key: 'arrow', direction: `right` });
    } else if (key === ' ') {
      listener({ key: 'space' });
    } else if (code === 'KeyE') {
      listener({ key: 'letter', letter: 'E' });
    } else if (code === 'KeyM') {
      listener({ key: 'letter', letter: 'M' });
    } else if (code === 'KeyH') {
      listener({ key: 'letter', letter: 'H' });
    } else if (code === 'Backspace') {
      listener({ key: 'backspace' });
    } else if (code.startsWith('Digit')) {
      const digit = Number(event.code.slice('Digit'.length));
      listener({ key: 'digit', digit: digit });
    }
  }

  unsetMouseListener() {
    this.#canvasElement.oncontextmenu = null;
    this.#canvasElement.onmousedown = null;
    this.#canvasElement.onmouseup = null;
    this.#canvasElement.onmouseenter = null;
    this.#canvasElement.onmouseleave = null;
    this.#canvasElement.onmousemove = null;
  }

  setMouseListener(fn: (event: CanvasMouseEvent, pos: Vec2) => void): void {
    const getPos = (evt: MouseEvent) => {
      const rect = this.#canvasElement.getBoundingClientRect();
      return new Vec2(evt.clientX - rect.x, evt.clientY - rect.y);
    };

    this.#canvasElement.oncontextmenu = (evt: MouseEvent) => {
      evt.preventDefault();
    };

    this.#canvasElement.onmousedown = (evt: MouseEvent) => {
      fn(
        {
          mode: 'button',
          state: 'down',
          button: evt.button === 2 ? 'secondary' : 'primary',
        },
        getPos(evt)
      );
    };

    this.#canvasElement.onmouseup = (evt: MouseEvent) => {
      fn(
        {
          mode: 'button',
          state: 'up',
          button: evt.button === 2 ? 'secondary' : 'primary',
        },
        getPos(evt)
      );
    };

    this.#canvasElement.onmouseenter = (evt: MouseEvent) => {
      fn(
        {
          mode: 'boundary',
          boundary: 'enter',
        },
        getPos(evt)
      );
    };

    this.#canvasElement.onmouseleave = (evt: MouseEvent) => {
      fn(
        {
          mode: 'boundary',
          boundary: 'exit',
        },
        getPos(evt)
      );
    };

    this.#canvasElement.onmousemove = (evt: MouseEvent) => {
      fn(
        {
          mode: 'move',
        },
        getPos(evt)
      );
    };
  }
}
