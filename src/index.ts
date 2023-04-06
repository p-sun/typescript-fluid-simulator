import { Canvas, CanvasListener } from './Canvas';
import { cSize, draw } from './FluidDraw';
import { appendHTMLButtons } from './FluidHTMLButtons';
import { getSceneConfig, Scene, setObstacle } from './FluidScene';

const INITIAL_SCENE = 1;

class FluidSim implements CanvasListener {
  public scene: Scene;
  private mouseDown = false;
  private context: CanvasRenderingContext2D;

  constructor(scene: Scene, context: CanvasRenderingContext2D) {
    this.scene = scene;
    this.context = context;
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
      update();
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
    return canvasX / cSize.y;
  }

  // Simulation coordinates go from [0, 1] on the Y-axis
  private sY(canvasY: number) {
    return (cSize.y - canvasY) / cSize.y;
  }
}

const initialScene = appendHTMLButtons(
  INITIAL_SCENE,
  document.body,
  (num: number) => {
    const newScene = getSceneConfig(num, cSize);
    if (fluidSim) {
      fluidSim.scene = newScene;
    }
    return newScene;
  }
);

const fluidCanvas = new Canvas(
  document.getElementById('myCanvas') as HTMLCanvasElement,
  cSize // Canvas and Canvas Context are the same size
);
const fluidSim = new FluidSim(initialScene, fluidCanvas.context);
fluidCanvas.setListener(fluidSim);

function update() {
  if (!fluidSim.scene.paused) {
    fluidSim.update();
    requestAnimationFrame(update);
  }
}
update();
