import { draw } from './FluidDraw';
import { inputsForScene } from './FluidHTMLButtons';
import { makeScene, Scene, TunnelType, setObstacle } from './FluidScene';
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

  keyDown(key: 'm' | 'p') {
    if (key === 'm') {
      this.step();
    } else if (key === 'p') {
      this.pausePressed();
    }
  }

  step() {
    this.scene.paused = false;
    this.simulate();
    draw(this.scene, this.cSize, this.context);
    this.scene.paused = true;
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
      this.scene.tunnel !== 'Latte Tunnel' ||
      (this.scene.tunnel == 'Latte Tunnel' && this.mouseDown)
    ) {
      this.scene.frameNr = this.scene.frameNr + 1;
    }
  }

  pausePressed() {
    this.scene.paused = !this.scene.paused;
    if (!this.scene.paused) {
      this.update();
    }
  }

  startDrag(cx: number, cy: number) {
    this.mouseDown = true;
    setObstacle(this.scene, this.sX(cx), this.sY(cy), true, true);
  }

  drag(cx: number, cy: number, isLeft: boolean) {
    if (this.mouseDown) {
      setObstacle(this.scene, this.sX(cx), this.sY(cy), false, isLeft);
    }
  }

  endDrag() {
    this.mouseDown = false;
    if (this.scene.tunnel === 'Latte Tunnel') {
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
  const initialScene = makeScene(options.initialTunnel, canvasSize, cachedRes);

  const fluidCanvas = new Canvas(
    document.getElementById(options.canvasDomId) as HTMLCanvasElement,
    canvasSize
  );
  const fluidSim = new FluidSim(initialScene, canvasSize, fluidCanvas.context);
  fluidCanvas.setListener(fluidSim);

  options.autostart ? fluidSim.update() : fluidSim.step();

  appendInputs(
    document.getElementById(options.buttonsDomId)!,
    canvasSize,
    initialScene,
    fluidSim
  );
}

function appendInputs(
  inputDiv: HTMLElement,
  canvasSize: Vec2,
  initialScene: Scene,
  fluidSim: FluidSim
) {
  const setDiv = (scene: Scene) => {
    inputDiv.innerHTML = '';
    inputDiv.append(
      ...inputsForScene({
        scene,
        onPauseToggled: () => {
          fluidSim.pausePressed();
        },
        onObstacleChanged: () => {
          fluidSim.updateObstacle();
        },
        onChangeScene,
      })
    );
  };
  const onChangeScene = (tunnel: TunnelType, resOverride?: number) => {
    cachedRes = resOverride ?? cachedRes;

    const scene = makeScene(tunnel, canvasSize, cachedRes);
    setDiv(scene);
    fluidSim.setScene(scene);
  };

  setDiv(initialScene);
}
