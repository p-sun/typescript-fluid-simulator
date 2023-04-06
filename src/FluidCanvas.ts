import { Scene } from './FluidScene';
import Vec2 from './GenericModels/Vec2';

export interface FluidCanvasListener {
  startDrag: (x: number, y: number) => void;
  endDrag: () => void;
  drag: (x: number, y: number) => void;
  step: () => void;
  togglePause: () => void;
}

export default class FluidCanvas {
  public context: CanvasRenderingContext2D;
  #canvas: HTMLCanvasElement;
  #size: Vec2 = Vec2.zero;
  #listener: FluidCanvasListener | undefined;

  constructor(canvas: HTMLCanvasElement, newSize: Vec2) {
    this.#canvas = canvas;
    this.context = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    this.setCanvasSize(newSize);
    this.setupListeners();
  }

  setListener(listener: FluidCanvasListener) {
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

export function appendHTMLButtons(
  initialNum: number,
  rootElement: HTMLElement,
  getSceneConfig: (num: number) => Scene
) {
  const inputDiv = document.createElement('inputDiv') as HTMLCanvasElement;
  rootElement.append(inputDiv);
  const initialScene = getSceneConfig(initialNum);
  const setupScene = (num: number) => {
    const scene = getSceneConfig(num);
    inputDiv.innerHTML = '';
    appendButtonsForScene(inputDiv, scene, setupScene);
    return scene;
  };
  appendButtonsForScene(inputDiv, initialScene, setupScene);
  return initialScene;
}

function appendButtonsForScene(
  root: HTMLElement,
  scene: Scene,
  setupScene: (num: number) => void
) {
  const inputs = createInputs(scene, setupScene);
  root.append(
    //inputs.startButton,
    document.createElement('br'),
    document.createElement('br'),
    ...inputs.buttons,
    document.createElement('br'),
    inputs.checkboxes.stream,
    'Streamlines',
    inputs.checkboxes.velocity,
    'Velocity',
    inputs.checkboxes.pressure,
    'Pressure',
    inputs.checkboxes.smoke,
    'Smoke',
    inputs.checkboxes.overRelax,
    'Over Relaxation',
    document.createElement('br'),
    document.createTextNode('Shortcuts: P - Pause/Start, M - Step')
  );
}

function createInputs(scene: Scene, setupScene: (num: number) => void) {
  function updateInputs() {
    inputs.checkboxes.stream.checked = scene.showStreamlines;
    inputs.checkboxes.velocity.checked = scene.showVelocities;
    inputs.checkboxes.pressure.checked = scene.showPressure;
    inputs.checkboxes.smoke.checked = scene.showSmoke;
    inputs.checkboxes.overRelax.checked = scene.overRelaxation > 1.0;
    inputs.startButton.innerHTML = scene.paused ? 'Start' : 'Pause';
  }

  const inputs = {
    startButton: createButton(scene.paused ? 'Start' : 'Pause', () => {
      scene.paused = !scene.paused;
      updateInputs();
    }),
    buttons: [
      createButton('Wind Tunnel', () => {
        setupScene(1);
        updateInputs();
      }),
      createButton('Paint Tunnel', () => {
        setupScene(2);
        updateInputs();
      }),
      createButton('Tank Tunnel', () => {
        setupScene(0);
        updateInputs();
      }),
      createButton('Hires Tunnel', () => {
        setupScene(3);
        updateInputs();
      }),
    ],
    checkboxes: {
      stream: createCheckbox(scene.showStreamlines, () => {
        scene.showStreamlines = !scene.showStreamlines;
      }),
      velocity: createCheckbox(scene.showVelocities, () => {
        scene.showVelocities = !scene.showVelocities;
      }),
      pressure: createCheckbox(scene.showPressure, () => {
        scene.showPressure = !scene.showPressure;
      }),
      smoke: createCheckbox(scene.showSmoke, () => {
        scene.showSmoke = !scene.showSmoke;
      }),
      overRelax: createCheckbox(scene.overRelaxation > 1.0, () => {
        scene.overRelaxation = scene.overRelaxation == 1.0 ? 1.9 : 1.0;
      }),
    },
  };
  return inputs;
}

function createButton(text: string, onclick: () => void) {
  let button = document.createElement('button');
  button.innerText = text;
  button.onclick = onclick;
  return button;
}

function createCheckbox(
  checked: boolean,
  onclick: () => void
): HTMLInputElement {
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.onclick = onclick;
  checkbox.checked = checked;
  return checkbox;
}
