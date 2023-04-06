import { Canvas, CanvasListener } from './Canvas';
import { CSIZE, draw } from './FluidDraw';
import { appendHTMLButtons } from './FluidHTMLButtons';
import { getSceneConfig, Scene, setObstacle } from './FluidScene';

export class FluidSim implements CanvasListener {
  public scene: Scene;
  private mouseDown = false;
  private context: CanvasRenderingContext2D;
  private startRunloop: () => void;

  constructor(
    scene: Scene,
    context: CanvasRenderingContext2D,
    startRunloop: () => void
  ) {
    this.scene = scene;
    this.context = context;
    this.startRunloop = startRunloop;
  }

  update() {
    this.simulate();
    draw(this.scene, this.context);
  }

  simulate() {
    const { dt, gravity, numIters } = this.scene;
    this.scene.fluid.simulate(this.scene, dt, gravity, numIters);
    this.scene.frameNr++;
  }

  togglePause() {
    this.scene.paused = !this.scene.paused;
    if (!this.scene.paused) {
      this.startRunloop();
    }
  }

  step() {
    this.scene.paused = false;
    this.simulate();
    draw(this.scene, this.context);
    this.scene.paused = true;
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

  private sX(canvasX: number) {
    return canvasX / CSIZE.y;
  }

  // Simulation coordinates go from [0, 1] on the Y-axis
  private sY(canvasY: number) {
    return (CSIZE.y - canvasY) / CSIZE.y;
  }
}

export function createFluidSim(
  sceneNum: number,
  rootElement: HTMLCanvasElement,
  startRunloop: () => void
) {
  const initialScene = appendHTMLButtons(
    sceneNum,
    document.body,
    (num: number) => {
      const newScene = getSceneConfig(num, CSIZE);
      if (fluidSim) {
        fluidSim.scene = newScene;
      }
      return newScene;
    }
  );

  const fluidCanvas = new Canvas(rootElement, CSIZE);
  const fluidSim = new FluidSim(
    initialScene,
    fluidCanvas.context,
    startRunloop
  );
  fluidCanvas.setListener(fluidSim);
  return fluidSim;
}
