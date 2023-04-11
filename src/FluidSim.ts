import { Canvas, CanvasListener } from './Canvas';
import { CSIZE, draw } from './FluidDraw';
import { inputsForScene } from './FluidHTMLButtons';
import { getSceneConfig, Scene, TunnelType, setObstacle } from './FluidScene';

export class FluidSim implements CanvasListener {
  private scene: Scene;
  private mouseDown = false;
  private context: CanvasRenderingContext2D;

  constructor(scene: Scene, context: CanvasRenderingContext2D) {
    this.scene = scene;
    this.context = context;
  }

  setScene(scene: Scene) {
    this.scene = scene;
  }

  update() {
    this.simulate();
    draw(this.scene, this.context);
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
    draw(this.scene, this.context);
    this.scene.paused = true;
  }

  private sX(canvasX: number) {
    return canvasX / CSIZE.y;
  }

  // Simulation coordinates go from [0, 1] on the Y-axis
  private sY(canvasY: number) {
    return (CSIZE.y - canvasY) / CSIZE.y;
  }
}

// Cache the resolution override, so that we can keep it when switching tunnels.
let cachedRes: number | undefined;

export function createFluidSim(options: {
  initialTunnel: TunnelType;
  canvasDomId: string;
  buttonsDomId: string;
  autostart: boolean;
  resolutionOverride?: number;
}) {
  cachedRes = options.resolutionOverride;
  const initialScene = getSceneConfig(options.initialTunnel, CSIZE, cachedRes);

  const fluidCanvas = new Canvas(
    document.getElementById(options.canvasDomId) as HTMLCanvasElement,
    CSIZE
  );
  const fluidSim = new FluidSim(initialScene, fluidCanvas.context);
  fluidCanvas.setListener(fluidSim);

  appendInputs(
    document.getElementById(options.buttonsDomId)!,
    initialScene,
    fluidSim
  );

  options.autostart ? fluidSim.update() : fluidSim.step();
}

function appendInputs(
  inputDiv: HTMLElement,
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

    const scene = getSceneConfig(tunnel, CSIZE, cachedRes);
    setDiv(scene);
    fluidSim.setScene(scene);
  };

  setDiv(initialScene);
}
