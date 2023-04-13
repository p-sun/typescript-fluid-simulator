import { FluidPhysics } from './FluidPhysics';
import Vec2 from './Utils/Vec2';

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
  showObstacle: boolean;
  showStreamlines: boolean;
  showVelocities: boolean;
  showPressure: boolean;
  showSmoke: boolean;
  showSolid: boolean;
  tunnel: TunnelType;
  fluid: FluidPhysics;
};

export type TunnelType =
  | 'Wind Tunnel'
  | 'Paint Tunnel'
  | 'Tank Tunnel'
  | 'HiRes Tunnel';

function makeFluidPhysics(numY: number, canvasSize: Vec2) {
  const domainHeight = 1.0;
  const domainWidth = (domainHeight * canvasSize.x) / canvasSize.y;
  const h = domainHeight / numY;
  const numX = Math.floor(domainWidth / h);
  const density = 1000.0;
  return new FluidPhysics(density, numX, numY, h);
}

export function getSceneConfig(
  tunnel: TunnelType,
  canvasSize: Vec2,
  resOverride?: number
): Scene {
  const resolution = resOverride
    ? resOverride
    : tunnel === 'Tank Tunnel'
    ? 50
    : tunnel === 'HiRes Tunnel'
    ? 200
    : 100;

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
    tunnel: 'Tank Tunnel',
    showObstacle: true,
    showStreamlines: false,
    showVelocities: false,
    showPressure: false,
    showSmoke: true,
    showSolid: false,
    fluid: makeFluidPhysics(resolution, canvasSize),
  };

  scene.tunnel = tunnel;
  scene.obstacleRadius = 0.15;
  scene.overRelaxation = 1.9;

  scene.dt = 1.0 / 60.0;
  scene.numIters = 40;

  const f = scene.fluid;
  const n = f.numY;

  if (tunnel === 'Tank Tunnel') {
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        const isSolid = i == 0 || i == f.numX - 1 || j == 0; // Left, right, bottom wall
        f.s[i * n + j] = isSolid ? 0 : 1;
      }
    }

    scene.gravity = -9.81;
    scene.showPressure = true;
    scene.showSmoke = false;
    scene.showStreamlines = false;
    scene.showVelocities = false;
  } else if (tunnel === 'Wind Tunnel' || tunnel === 'HiRes Tunnel') {
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        const isSolid = i == 0 || j == 0 || j == f.numY - 1; // Left, bottom, top wall
        f.s[i * n + j] = isSolid ? 0 : 1;
      }
    }

    // Vortex shedding. Set horizontal velocity at column i = 1. i = 0 is left wall.
    const inVel = 2;
    for (let j = 0; j < f.numY; j++) {
      f.u[1 * n + j] = inVel;
    }

    // Short vertical column of black smoke at i = 0
    const pipeH = 0.1 * f.numY;
    const minJ = Math.floor(0.5 * f.numY - 0.5 * pipeH);
    const maxJ = Math.floor(0.5 * f.numY + 0.5 * pipeH);
    for (let j = minJ; j < maxJ; j++) f.m[j] = 0; // Black smoke = 0

    setObstacle(scene, 0.4, 0.5, true);

    scene.gravity = 0.0;
    scene.showPressure = false;
    scene.showSmoke = true;
    scene.showStreamlines = false;
    scene.showVelocities = false;

    if (tunnel === 'HiRes Tunnel') {
      scene.dt = 1.0 / 120.0;
      scene.numIters = 100;
      scene.showPressure = true;
    }
  } else if (tunnel === 'Paint Tunnel') {
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

  // For all cells except the 4 sides
  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      // Set to fluid
      f.s[i * n + j] = 1.0;

      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;
      // If cell is inside obstacle:
      if (dx * dx + dy * dy < r * r) {
        // Set cell to solid
        f.s[i * n + j] = 0.0;

        if (scene.tunnel === 'Paint Tunnel') {
          // Set smoke to # based on time, between 0 & 1 inclusive
          f.m[i * n + j] = 0.5 + 0.5 * Math.sin(0.1 * scene.frameNr);
        } else {
          // Set smoke to white
          f.m[i * n + j] = 1.0;
        }

        // New velocity is how fast the obstacle moved since last frame
        f.u[i * n + j] = vx;
        f.u[(i + 1) * n + j] = vx;
        f.v[i * n + j] = vy;
        f.v[i * n + j + 1] = vy;
      }
    }
  }
}
