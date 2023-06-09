import Vec2 from './Vec2';

export interface CanvasListener {
  startDrag: (x: number, y: number, isLeft: boolean) => void;
  endDrag: () => void;
  drag: (x: number, y: number, isLeft: boolean) => void;
  keyDown: (key: string) => void;
}

export class Canvas {
  #context: CanvasRenderingContext2D;
  #canvas: HTMLCanvasElement;
  #size: Vec2 = new Vec2(300, 150);
  #listener: CanvasListener | undefined;

  constructor(canvas: HTMLCanvasElement, size: Vec2) {
    this.#canvas = canvas;
    this.#context = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    this.setupListeners();
    this.setCanvasSize(size);
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

  public get context(): CanvasRenderingContext2D {
    return this.#context;
  }

  setCanvasSize(newSize: Vec2) {
    this.#size = newSize;

    this.#canvas.style.width = newSize.x + 'px';
    this.#canvas.style.height = newSize.y + 'px';

    const scale = window.devicePixelRatio;
    this.#canvas.width = Math.floor(newSize.x * scale);
    this.#canvas.height = Math.floor(newSize.y * scale);
    this.#context.scale(scale, scale);
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
    const getPos = (clientX: number, clientY: number) => {
      const rect = this.#canvas.getBoundingClientRect();
      return { x: clientX - rect.x, y: clientY - rect.y };
    };

    document.addEventListener('keydown', (event) => {
      this.#listener?.keyDown(event.key);
    });

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    });

    this.#canvas.addEventListener('mousedown', (e) => {
      const { x, y } = getPos(e.clientX, e.clientY);
      this.#listener?.startDrag(x, y, e.buttons === 1);
    });

    this.#canvas.addEventListener('mouseup', (e) => {
      this.#listener?.endDrag();
    });

    this.#canvas.addEventListener('mousemove', (e) => {
      const { x, y } = getPos(e.clientX, e.clientY);
      this.#listener?.drag(x, y, e.buttons === 1);
    });

    this.#canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const { x, y } = getPos(e.touches[0].clientX, e.touches[0].clientY);
      this.#listener?.startDrag(x, y, e.touches.length === 1);
    });

    this.#canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const { x, y } = getPos(e.touches[0].clientX, e.touches[0].clientY);
        this.#listener?.drag(x, y, e.touches.length === 1);
      },
      { passive: false }
    );

    this.#canvas.addEventListener('touchend', (e) => {
      this.#listener?.endDrag();
    });
  }
}
