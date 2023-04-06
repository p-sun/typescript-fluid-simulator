import { Canvas, CanvasListener } from './Canvas';
import { CSIZE, draw } from './FluidDraw';
import { appendHTMLButtons } from './FluidHTMLButtons';
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

  private pausePressed() {
    this.scene.paused = !this.scene.paused;
    if (!this.scene.paused) {
      this.update();
    }
  }

  private step() {
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

// Can't go inside createFluidSim, to make it work with StackBlitz.
let fluidSim: FluidSim | undefined;

export function createFluidSim(
  tunnel: TunnelType,
  rootElement: HTMLCanvasElement,
  buttonsElement: HTMLCanvasElement
) {
  const initialScene = appendHTMLButtons(
    tunnel,
    buttonsElement,
    (tunnel: TunnelType) => {
      const newScene = getSceneConfig(tunnel, CSIZE);
      if (fluidSim) {
        fluidSim.setScene(newScene);
      }
      return newScene;
    }
  );

  const fluidCanvas = new Canvas(rootElement, CSIZE);
  fluidSim = new FluidSim(initialScene, fluidCanvas.context);
  fluidCanvas.setListener(fluidSim);
  return fluidSim;
}
