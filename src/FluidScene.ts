import { FluidPhysics } from './FluidPhysics';
import Vec2 from './GenericModels/Vec2';

export type Scene = {
  gravity: number;
  dt: number;
  numIters: number;
  frameNr: number;
  overRelaxation: number;
  obstacleX: number;
  obstacleY: number;
  obstacleRadius: number;
  paused: boolean;
  sceneNr: number;
  showObstacle: boolean;
  showStreamlines: boolean;
  showVelocities: boolean;
  showPressure: boolean;
  showSmoke: boolean;
  fluid: FluidPhysics;
};

function makeFluidPhysics(numY: number, canvasSize: Vec2) {
  const domainHeight = 1.0;
  const domainWidth = (domainHeight * canvasSize.x) / canvasSize.y;
  const h = domainHeight / numY;
  const numX = Math.floor(domainWidth / h);
  const density = 1000.0;
  return new FluidPhysics(density, numX, numY, h);
}

export function getSceneConfig(sceneNr: number, canvasSize: Vec2): Scene {
  const resolution = sceneNr == 0 ? 50 : sceneNr == 3 ? 200 : 100;

  const scene: Scene = {
    gravity: -9.81,
    dt: 1.0 / 120.0,
    numIters: 100,
    frameNr: 0,
    overRelaxation: 1.9,
    obstacleX: 0.0,
    obstacleY: 0.0,
    obstacleRadius: 0.15,
    paused: false,
    sceneNr: 0,
    showObstacle: false,
    showStreamlines: false,
    showVelocities: false,
    showPressure: false,
    showSmoke: true,
    fluid: makeFluidPhysics(resolution, canvasSize),
  };

  scene.sceneNr = sceneNr;
  scene.obstacleRadius = 0.15;
  scene.overRelaxation = 1.9;

  scene.dt = 1.0 / 60.0;
  scene.numIters = 40;

  const f = scene.fluid;
  const n = f.numY;

  if (sceneNr == 0) {
    // tank
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        let s = 1.0; // fluid
        if (i == 0 || i == f.numX - 1 || j == 0) s = 0.0; // solid
        f.s[i * n + j] = s;
      }
    }
    scene.gravity = -9.81;
    scene.showPressure = true;
    scene.showSmoke = false;
    scene.showStreamlines = false;
    scene.showVelocities = false;
  } else if (sceneNr == 1 || sceneNr == 3) {
    // vortex shedding
    const inVel = 2.0;
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        let s = 1.0; // fluid
        if (i == 0 || j == 0 || j == f.numY - 1) s = 0.0; // solid
        f.s[i * n + j] = s;

        if (i == 1) {
          f.u[i * n + j] = inVel;
        }
      }
    }

    const pipeH = 0.1 * f.numY;
    const minJ = Math.floor(0.5 * f.numY - 0.5 * pipeH);
    const maxJ = Math.floor(0.5 * f.numY + 0.5 * pipeH);

    for (let j = minJ; j < maxJ; j++) f.m[j] = 0.0;

    setObstacle(scene, 0.4, 0.5, true);

    scene.gravity = 0.0;
    scene.showPressure = false;
    scene.showSmoke = true;
    scene.showStreamlines = false;
    scene.showVelocities = false;

    if (sceneNr == 3) {
      scene.dt = 1.0 / 120.0;
      scene.numIters = 100;
      scene.showPressure = true;
    }
  } else if (sceneNr == 2) {
    // paint
    scene.gravity = 0.0;
    scene.overRelaxation = 1.0;
    scene.showPressure = false;
    scene.showSmoke = true;
    scene.showStreamlines = false;
    scene.showVelocities = false;
    scene.obstacleRadius = 0.03;
  }

  return scene;
}

export function setObstacle(
  scene: Scene,
  x: number,
  y: number,
  reset: boolean
): void {
  let vx = 0.0;
  let vy = 0.0;

  if (!reset) {
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  const r = scene.obstacleRadius;
  const f = scene.fluid;
  const n = f.numY;

  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      f.s[i * n + j] = 1.0;

      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;

      if (dx * dx + dy * dy < r * r) {
        f.s[i * n + j] = 0.0;
        if (scene.sceneNr == 2) {
          f.m[i * n + j] = 0.5 + 0.5 * Math.sin(0.1 * scene.frameNr);
        } else {
          f.m[i * n + j] = 1.0;
        }
        f.u[i * n + j] = vx;
        f.u[(i + 1) * n + j] = vx;
        f.v[i * n + j] = vy;
        f.v[i * n + j + 1] = vy;
      }
    }
  }

  scene.showObstacle = true;
}
