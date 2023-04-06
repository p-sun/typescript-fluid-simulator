import Vec2 from './GenericModels/Vec2';

export interface CanvasListener {
  startDrag: (x: number, y: number) => void;
  endDrag: () => void;
  drag: (x: number, y: number) => void;
  step: () => void;
  togglePause: () => void;
}

export class Canvas {
  public context: CanvasRenderingContext2D;
  #canvas: HTMLCanvasElement;
  #size: Vec2 = Vec2.zero;
  #listener: CanvasListener | undefined;

  constructor(canvas: HTMLCanvasElement, newSize: Vec2) {
    this.#canvas = canvas;
    this.context = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    this.setCanvasSize(newSize);
    this.setupListeners();
  }

  setListener(listener: CanvasListener) {
    this.#listener = listener;
  }

  public get width(): number {
    return this.#size.x;
  }

  public get height(): number {
    return this.#size.y;
  }

  setCanvasSize(newSize: Vec2) {
    this.#size = newSize;

    this.#canvas.style.width = newSize.x + 'px';
    this.#canvas.style.height = newSize.y + 'px';

    const scale = window.devicePixelRatio;
    this.#canvas.width = Math.floor(newSize.x * scale);
    this.#canvas.height = Math.floor(newSize.y * scale);
    this.context.scale(scale, scale);
    this.#canvas.focus();
  }

  get midpoint(): Vec2 {
    return this.fromNormalizedCoordinate(new Vec2(0.5, 0.5));
  }

  fromNormalizedCoordinate(coord: Vec2): Vec2 {
    return this.#size.componentMul(coord);
  }

  toNormalizedCoordinate(pos: Vec2): Vec2 {
    return pos.componentDiv(this.#size);
  }

  private setupListeners() {
    const getPos = (e: MouseEvent) => {
      const rect = this.#canvas.getBoundingClientRect();
      return { x: e.clientX - rect.x, y: e.clientY - rect.y };
    };

    const getTouchPos = (e: Touch) => {
      const rect = this.#canvas.getBoundingClientRect();
      return { x: e.clientX - rect.x, y: e.clientY - rect.y };
    };

    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'p':
          this.#listener?.togglePause();
          break;
        case 'm':
          this.#listener?.step();
          break;
      }
    });

    this.#canvas.addEventListener('mousedown', (e) => {
      const { x, y } = getPos(e);
      this.#listener?.startDrag(x, y);
    });

    this.#canvas.addEventListener('mouseup', (e) => {
      this.#listener?.endDrag();
    });

    this.#canvas.addEventListener('mousemove', (e) => {
      const { x, y } = getPos(e);
      this.#listener?.drag(x, y);
    });

    this.#canvas.addEventListener('touchstart', (e) => {
      const { x, y } = getTouchPos(e.touches[0]);
      this.#listener?.startDrag(x, y);
    });

    this.#canvas.addEventListener('touchend', (e) => {
      this.#listener?.endDrag();
    });

    this.#canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const { x, y } = getTouchPos(e.touches[0]);
        this.#listener?.drag(x, y);
      },
      { passive: false }
    );
  }
}
