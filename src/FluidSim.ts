import { draw } from './FluidDraw';
import { inputsForScene } from './FluidHTMLButtons';
import { getSceneConfig, Scene, TunnelType, setObstacle } from './FluidScene';
import { Canvas, CanvasListener } from './Utils/Canvas';
import Vec2 from './Utils/Vec2';

export class FluidSim implements CanvasListener {
  private scene: Scene;
  private mouseDown = false;
  private readonly context: CanvasRenderingContext2D;
  private readonly cSize: Vec2;

  constructor(scene: Scene, cSize: Vec2, context: CanvasRenderingContext2D) {
    this.scene = scene;
    this.context = context;
    this.cSize = cSize;
  }

  setScene(scene: Scene) {
    this.scene = scene;
  }

  update() {
    this.simulate();
    draw(this.scene, this.cSize, this.context);
    if (!this.scene.paused) {
      requestAnimationFrame(this.update.bind(this));
    }
  }

  simulate() {
    const { dt, gravity, numIters } = this.scene;
    this.scene.fluid.simulate(this.scene, dt, gravity, numIters);
    this.scene.frameNr++;
  }

  keyDown(key: 'm' | 'p') {
    if (key === 'm') {
      this.step();
    } else if (key === 'p') {
      this.pausePressed();
    }
  }

  startDrag(cx: number, cy: number) {
    this.mouseDown = true;
    setObstacle(this.scene, this.sX(cx), this.sY(cy), true);
  }

  drag(cx: number, cy: number) {
    if (this.mouseDown) {
      setObstacle(this.scene, this.sX(cx), this.sY(cy), false);
    }
  }

  endDrag() {
    this.mouseDown = false;
  }

  pausePressed() {
    this.scene.paused = !this.scene.paused;
    if (!this.scene.paused) {
      this.update();
    }
  }

  step() {
    this.scene.paused = false;
    this.simulate();
    draw(this.scene, this.cSize, this.context);
    this.scene.paused = true;
  }

  private sX(canvasX: number) {
    return canvasX / this.cSize.y;
  }

  // Simulation coordinates go from [0, 1] on the Y-axis
  private sY(canvasY: number) {
    return (this.cSize.y - canvasY) / this.cSize.y;
  }
}

// Cache the resolution override, so that we can keep it when switching tunnels.
let cachedRes: number | undefined;

export function createFluidSim(options: {
  initialTunnel: TunnelType;
  canvasDomId: string;
  buttonsDomId: string;
  canvasSize: Vec2;
  autostart: boolean;
  resolutionOverride?: number;
}) {
  cachedRes = options.resolutionOverride;
  const { canvasSize } = options;
  const initialScene = getSceneConfig(
    options.initialTunnel,
    canvasSize,
    cachedRes
  );

  const fluidCanvas = new Canvas(
    document.getElementById(options.canvasDomId) as HTMLCanvasElement,
    canvasSize
  );
  const fluidSim = new FluidSim(initialScene, canvasSize, fluidCanvas.context);
  fluidCanvas.setListener(fluidSim);

  appendInputs(
    document.getElementById(options.buttonsDomId)!,
    canvasSize,
    initialScene,
    fluidSim
  );

  options.autostart ? fluidSim.update() : fluidSim.step();
}

function appendInputs(
  inputDiv: HTMLElement,
  canvasSize: Vec2,
  initialScene: Scene,
  fluidSim: FluidSim
) {
  const onPauseToggled = () => {
    fluidSim.pausePressed();
  };
  const setDiv = (scene: Scene) => {
    inputDiv.innerHTML = '';
    inputDiv.append(...inputsForScene(scene, onPauseToggled, onChangeScene));
  };
  const onChangeScene = (tunnel: TunnelType, resOverride?: number) => {
    cachedRes = resOverride ?? cachedRes;

    const scene = getSceneConfig(tunnel, canvasSize, cachedRes);
    setDiv(scene);
    fluidSim.setScene(scene);
  };

  setDiv(initialScene);
}
