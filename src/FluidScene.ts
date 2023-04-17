import { FluidPhysics } from './FluidPhysics';
import Vec2 from './Utils/Vec2';

export type TunnelType =
  | 'Wind Tunnel'
  | 'Paint Tunnel'
  | 'Tank Tunnel'
  | 'HiRes Tunnel'
  | 'Latte Tunnel';

export type Scene = {
  tunnel: TunnelType;
  paused: boolean;
  fluid: FluidPhysics;
} & SceneConfig;

const defaultSceneConfig = {
  dt: 1.0 / 60.0,
  gravity: 0,
  overRelaxation: 1.9,
  smokeDissipation: 1.0,
  numIters: 20,
  frameNr: 0,
  resolution: 100,
  drag: 1,

  obstacleRadius: 0.15,
  obstacleX: 0,
  obstacleY: 0,

  lattePen: false,
  latteCupRadius: 0.4,
  milkStartSpeed: 0.8,
  milkTimeToZeroSpeed: 6,

  showObstacle: true,
  showStreamlines: false,
  showVelocities: false,
  showPressure: false,
  showSmoke: true,
  showSolid: false,
};

type SceneConfig = typeof defaultSceneConfig;

function makeSceneConfig(tunnel: TunnelType): SceneConfig {
  switch (tunnel) {
    case 'HiRes Tunnel':
      return {
        ...defaultSceneConfig,
        resolution: 200,
        showPressure: true,
        dt: 1 / 120,
        numIters: 100,
      };
    case 'Paint Tunnel':
      return {
        ...defaultSceneConfig,
        overRelaxation: 0.4,
        obstacleRadius: 0.03,
      };
    case 'Tank Tunnel':
      return {
        ...defaultSceneConfig,
        gravity: -9.81,
        resolution: 50,
        showPressure: true,
        showSmoke: false,
      };
    case 'Latte Tunnel':
      return {
        ...defaultSceneConfig,
        resolution: 180,
        numIters: 20,
        overRelaxation: 1,
        obstacleRadius: 0.038,
        drag: 0.97,
      };
    default:
      return {
        ...defaultSceneConfig,
      };
  }
}

function makeFluidPhysics(numY: number, canvasSize: Vec2, drag: number) {
  const domainHeight = 1.0;
  const domainWidth = (domainHeight * canvasSize.x) / canvasSize.y;
  const h = domainHeight / numY;
  const numX = Math.floor(domainWidth / h);
  const density = 1000.0;
  return new FluidPhysics(density, drag, numX, numY, h);
}

export function makeScene(
  tunnel: TunnelType,
  canvasSize: Vec2,
  resOverride?: number
): Scene {
  const sceneConfig = makeSceneConfig(tunnel);
  const newFluid = makeFluidPhysics(
    resOverride ?? sceneConfig.resolution,
    canvasSize,
    sceneConfig.drag
  );
  const scene: Scene = {
    tunnel,
    ...sceneConfig,
    paused: false,
    fluid: newFluid,
  };

  const f = scene.fluid;
  const n = f.numY;

  if (tunnel === 'Tank Tunnel') {
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        const isSolid = i == 0 || i == f.numX - 1 || j == 0; // Left, right, bottom wall
        f.s[i * n + j] = isSolid ? 0 : 1;
      }
    }
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

    setObstacle(scene, 0.4, 0.5, true, true);
  } else if (tunnel === 'Latte Tunnel') {
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        f.m[i * n + j] = 0; // Darkest Brown Smoke
      }
    }
  }

  return scene;
}

export function setObstacle(
  scene: Scene,
  x: number,
  y: number,
  reset: boolean,
  isLeft: boolean = false
): void {
  let vx = 0.0;
  let vy = 0.0;

  if (!reset) {
    // How fast the obstacle moved since last frame
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  let r = scene.obstacleRadius;
  const f = scene.fluid;
  const n = f.numY;

  const latteCupOuter = scene.latteCupRadius;
  const latteCupInner = latteCupOuter - 0.01;
  const latteMilk = isLeft && !scene.lattePen;
  let latteV = 0.0; // Latte velocity
  if (scene.tunnel === 'Latte Tunnel') {
    if (isLeft) {
      // Over 5 secs since left mouse press, the radius shrinks from r to 0.53r.
      r = r * remap(scene.frameNr, 0, 6 / scene.dt, 1, 0.4);
      latteV = remap(
        scene.frameNr,
        0,
        scene.milkTimeToZeroSpeed / scene.dt,
        scene.milkStartSpeed,
        0
      );
    } else {
      r = 0.01;
      latteV = 0.0;
    }
  }

  // For all cells except the 4 sides
  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;
      const insideObstacle = dx * dx + dy * dy < r * r;
      if (scene.tunnel === 'Latte Tunnel') {
        const lx = (i + 0.5 - f.numX / 2) * f.h;
        const ly = (j + 0.5 - f.numY / 2) * f.h;
        const dFromCenter = lx * lx + ly * ly;
        if (dFromCenter > latteCupOuter * latteCupOuter) {
          f.s[i * n + j] = 0; // Solid
        } else {
          if (insideObstacle) {
            f.s[i * n + j] = 0.0; // Solid cell
            if (latteMilk) {
              f.m[i * n + j] = 1; // White smoke
            }
          } else {
            f.s[i * n + j] = 1; // Fluid
          }

          const isInsideInnerCup = dFromCenter < latteCupInner * latteCupInner;
          const aroundObstacle = dx * dx + dy * dy < (r + 0.03) * (r + 0.03);
          if (isInsideInnerCup) {
            if (latteMilk && aroundObstacle) {
              // Horizontal velocity is dampened mouse velocity. Faster on the edges.
              f.u[i * n + j] = vx * (dx / r) * latteV * (dx > 0 ? 1 : -1);
              f.v[i * n + j] = dy < 0 ? (dy / r) * latteV : 0;
            } else if (!latteMilk && insideObstacle) {
              f.u[i * n + j] = vx;
              f.v[i * n + j] = vy;
            }
          }
        }
      } else {
        if (insideObstacle) {
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
        } else {
          // Set to fluid
          f.s[i * n + j] = 1.0;
        }
      }
    }
  }
}

function remap(
  n: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number
) {
  const val = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  return clamp(val, start2, stop2);
}

function clamp(n: number, min: number, max: number) {
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return Math.max(min, Math.min(max, n));
}
