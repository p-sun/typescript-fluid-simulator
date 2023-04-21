import { draw } from './FluidDraw';
import { inputsForScene } from './FluidHTMLButtons';
import {
  makeScene,
  Scene,
  SceneConfig,
  SceneTag,
  setObstacle,
} from './FluidScene';
import { Canvas, CanvasListener } from './Utils/Canvas';
import Vec2 from './Utils/Vec2';

export class FluidSim implements CanvasListener {
  private scene: Scene;
  private mouseDown = false;
  private overrides: Partial<SceneConfig> = {};
  private readonly cSize: Vec2;
  private readonly inputDiv: HTMLElement;
  private readonly context: CanvasRenderingContext2D;

  constructor(
    sceneTag: SceneTag,
    cSize: Vec2,
    overrides: Partial<SceneConfig>,
    inputDiv: HTMLElement,
    context: CanvasRenderingContext2D
  ) {
    this.overrides = overrides;
    this.cSize = cSize;
    this.inputDiv = inputDiv;
    this.context = context;
    this.scene = this.setScene(sceneTag);
  }

  setScene(sceneTag: SceneTag): Scene {
    this.scene = makeScene(sceneTag, this.cSize, this.overrides);
    this.setDiv(this.scene);
    return this.scene;
  }

  setDiv(scene: Scene) {
    this.inputDiv.innerHTML = '';
    this.inputDiv.append(
      ...inputsForScene({
        scene,
        onObstacleChanged: () => {
          this.updateObstacle();
        },
        onKeyPress: (key: string) => {
          this.keyDown(key);
        },
        onChangeOverrides: (newOverrides: Partial<SceneConfig>) => {
          this.overrides = { ...this.overrides, ...(newOverrides ?? {}) };
        },
        onChangeScene: (tag: SceneTag) => {
          this.overrides = {};
          this.setScene(tag);
        },
        updateInputs: () => {
          this.setDiv(this.scene);
        },
      })
    );
  }

  keyDown(key: string) {
    if (key === 'n') {
      this.step();
    } else if (key === 'p') {
      this.pausePressed();
    } else if (key === 'c') {
      this.setScene(this.scene.tag);
    } else if (key === 'r') {
      this.overrides = {};
      this.setScene(this.scene.tag);
    }
  }

  step() {
    if (!this.scene.paused) {
      this.pausePressed();
    }
    this.simulate();
    draw(this.scene, this.cSize, this.context);
  }

  update() {
    this.simulate();
    draw(this.scene, this.cSize, this.context);
    if (!this.scene.paused) {
      requestAnimationFrame(this.update.bind(this));
    }
  }

  simulate() {
    this.scene.fluid.simulate(this.scene, this.scene.dt);
    if (
      this.scene.tag === 'Paint Scene' ||
      (this.scene.tag == 'Latte Scene' &&
        this.scene.tool === 'Milk' &&
        this.mouseDown)
    ) {
      this.scene.frameNr = this.scene.frameNr + 1;
    }
  }

  pausePressed() {
    this.scene.paused = !this.scene.paused;
    if (!this.scene.paused) {
      this.update();
    }
    this.setDiv(this.scene);
  }

  startDrag(cx: number, cy: number, isLeft: boolean) {
    this.mouseDown = true;
    setObstacle(this.scene, this.sX(cx), this.sY(cy), true, isLeft);
  }

  drag(cx: number, cy: number, isLeft: boolean) {
    if (this.mouseDown) {
      setObstacle(this.scene, this.sX(cx), this.sY(cy), false, isLeft);
    }
  }

  endDrag() {
    this.mouseDown = false;
    if (this.scene.tag === 'Latte Scene') {
      setObstacle(this.scene, 0, 0, true);
    }
  }

  updateObstacle() {
    setObstacle(this.scene, this.scene.obstacleX, this.scene.obstacleY, false);
  }

  private sX(canvasX: number) {
    return canvasX / this.cSize.y;
  }

  // Simulation coordinates go from [0, 1] on the Y-axis
  private sY(canvasY: number) {
    return (this.cSize.y - canvasY) / this.cSize.y;
  }
}

export function createFluidSim(options: {
  initialSceneTag: SceneTag;
  canvasDomId: string;
  inputDomId: string;
  canvasSize: Vec2;
  autostart: boolean;
  overrides: Partial<SceneConfig>;
}) {
  const fluidCanvas = new Canvas(
    document.getElementById(options.canvasDomId) as HTMLCanvasElement,
    options.canvasSize
  );
  const fluidSim = new FluidSim(
    options.initialSceneTag,
    options.canvasSize,
    options.overrides,
    document.getElementById(options.inputDomId) as HTMLCanvasElement,
    fluidCanvas.context
  );
  fluidCanvas.setListener(fluidSim);

  options.autostart ? fluidSim.update() : fluidSim.step();
}
