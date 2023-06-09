import { FluidPhysics } from './FluidPhysics';
import { clamp, remap } from './Utils/MathUtils';
import Vec2 from './Utils/Vec2';

export type SceneTag =
  | 'Wind Scene'
  | 'Paint Scene'
  | 'Tank Scene'
  | 'HiRes Scene'
  | 'Latte Scene';

export type LatteTool = 'Milk' | 'Spoon' | 'Latte Pen' | 'Chocolate';

export type Scene = {
  tag: SceneTag;
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

  showObstacle: true,
  showStreamlines: false,
  showVelocities: false,
  showPressure: false,
  showSmoke: true,
  showSolid: false,

  // Latte Art Specific
  tool: 'Milk' as LatteTool,
  latteCupRadius: 0.42,
  lattePenRadius: 0.008,
  chocolateRadius: 0.02,
  milkStartSpeed: 0.8,
  timeToZeroMilkSpeed: 6.0,
  timeToMinObstacleRadius: 7.0,
};

export type SceneConfig = typeof defaultSceneConfig;

function makeSceneConfig(tag: SceneTag): SceneConfig {
  switch (tag) {
    case 'HiRes Scene':
      return {
        ...defaultSceneConfig,
        resolution: 200,
        showPressure: true,
        dt: 1 / 120,
        numIters: 100,
      };
    case 'Paint Scene':
      return {
        ...defaultSceneConfig,
        overRelaxation: 0.4,
        obstacleRadius: 0.03,
      };
    case 'Tank Scene':
      return {
        ...defaultSceneConfig,
        gravity: -9.81,
        resolution: 50,
        showPressure: true,
        showSmoke: false,
      };
    case 'Latte Scene':
      return {
        ...defaultSceneConfig,
        resolution: 180,
        numIters: 20,
        overRelaxation: 1.4,
        obstacleRadius: 0.036,
        drag: 0.97,
        showObstacle: false,
      };
    default:
      return {
        ...defaultSceneConfig,
      };
  }
}

export function makeScene(
  tag: SceneTag,
  canvasSize: Vec2,
  overrides: Partial<SceneConfig>
): Scene {
  const sceneConfig = {
    ...makeSceneConfig(tag),
    ...removeKeysWithUndefinedValues({ ...overrides }),
  };
  const scene: Scene = {
    tag: tag,
    ...sceneConfig,
    paused: false,
    fluid: FluidPhysics.makeFluidPhysics(sceneConfig, canvasSize),
  };

  const f = scene.fluid;
  const n = f.numY;

  if (tag === 'Tank Scene') {
    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        const isSolid = i == 0 || i == f.numX - 1 || j == 0; // Left, right, bottom wall
        f.s[i * n + j] = isSolid ? 0 : 1;
      }
    }
  } else if (tag === 'Wind Scene' || tag === 'HiRes Scene') {
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
  } else if (tag === 'Latte Scene') {
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
  const tool: LatteTool = !isLeft ? 'Latte Pen' : scene.tool;
  const minRadius = 0.015;
  let latteV = 0.0; // Latte velocity
  if (scene.tag === 'Latte Scene') {
    const framesTo0Speed = scene.timeToZeroMilkSpeed / scene.dt;
    const framesToMinRadius = scene.timeToMinObstacleRadius / scene.dt;

    if (tool === 'Milk') {
      latteV = remap(scene.frameNr, 0, framesTo0Speed, scene.milkStartSpeed, 0);
      if (scene.frameNr <= framesToMinRadius) {
        // Over some secs after mouse press, the radius shrinks from r to minRadius
        r = remap(scene.frameNr, 0, framesToMinRadius, r, minRadius);
      }
    } else if (tool === 'Chocolate') {
      r = scene.chocolateRadius;
      latteV = 0;
    } else if (tool === 'Latte Pen') {
      r = scene.lattePenRadius;
      latteV = 0;
    }
  }

  // For all cells except the 4 sides
  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;
      const insideObstacle = dx * dx + dy * dy < r * r;
      if (scene.tag === 'Latte Scene') {
        const lx = (i + 0.5 - f.numX / 2) * f.h;
        const ly = (j + 0.5 - f.numY / 2) * f.h;
        const dFromCenter = lx * lx + ly * ly;
        if (dFromCenter > latteCupOuter * latteCupOuter) {
          f.s[i * n + j] = 0; // Solid
        } else {
          if (insideObstacle) {
            f.s[i * n + j] = 0.0; // Solid cell
            if (tool === 'Milk' || tool === 'Spoon') {
              f.m[i * n + j] = 1; // White smoke
              f.c[i * n + j] = 0;
            } else if (tool === 'Chocolate') {
              f.c[i * n + j] = 1;
            }
          } else {
            f.s[i * n + j] = 1; // Fluid
          }

          const isInsideInnerCup = dFromCenter < latteCupInner * latteCupInner;
          const aroundObstacle = dx * dx + dy * dy < (r + 0.03) * (r + 0.03);
          if (isInsideInnerCup) {
            if (tool === 'Milk' && aroundObstacle) {
              // Horizontal velocity is dampened mouse velocity. Faster on the edges.
              f.u[i * n + j] = vx * (dx / r) * latteV * (dx > 0 ? 1 : -1);
              f.v[i * n + j] = dy < 0 ? (dy / r) * latteV : 0;
            } else if (tool === 'Latte Pen' && insideObstacle) {
              f.u[i * n + j] = clamp(vx / 2, -0.2, 0.2);
              f.v[i * n + j] = clamp(vy / 2, -0.2, 0.2);
            }
          }
        }
      } else {
        if (insideObstacle) {
          // Set cell to solid
          f.s[i * n + j] = 0.0;

          if (scene.tag === 'Paint Scene') {
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

const removeKeysWithUndefinedValues = <T extends { [key: string]: unknown }>(
  obj: T
): T => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj;
};
