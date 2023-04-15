import { Scene } from './FluidScene';

type Field = 'U_FIELD' | 'V_FIELD' | 'S_FIELD';

export class FluidPhysics {
  density: number;
  drag: number;

  // Grid Sizes
  numX: number;
  numY: number;
  numCells: number; // Total number of cells
  h: number; // Height of each cell

  // Grid Fields
  u: Float32Array; // Horizontal velocity
  v: Float32Array; // Vertical velocity
  newU: Float32Array; // Buffer for horizontal velocity
  newV: Float32Array; // Buffer for horizontal velocity
  p: Float32Array; // Pressure
  s: Float32Array; // Solidness. 0 = solid, 1 = fluid
  m: Float32Array; // Smoke density. 0 = black, 1 = white
  newM: Float32Array; // Buffer for smoke density

  constructor(
    density: number,
    drag: number,
    numX: number,
    numY: number,
    h: number
  ) {
    this.density = density;
    this.drag = drag;
    this.numX = numX;
    this.numY = numY;
    this.numCells = this.numX * this.numY;
    this.h = h;
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);
    this.newU = new Float32Array(this.numCells);
    this.newV = new Float32Array(this.numCells);
    this.p = new Float32Array(this.numCells);
    this.s = new Float32Array(this.numCells);
    this.m = new Float32Array(this.numCells);
    this.newM = new Float32Array(this.numCells);
    this.m.fill(1.0);
  }

  integrate(dt: number, gravity: number) {
    const n = this.numY;
    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0)
          this.v[i * n + j] += gravity * dt;
      }
    }
  }

  extrapolate() {
    let n = this.numY;
    for (let i = 0; i < this.numX; i++) {
      // 0th col = 1st col
      this.u[i * n + 0] = this.u[i * n + 1];
      // last col = 2nd last col
      this.u[i * n + this.numY - 1] = this.u[i * n + this.numY - 2];
    }
    for (let j = 0; j < this.numY; j++) {
      // 0th row = 1st row
      this.v[0 * n + j] = this.v[1 * n + j];
      // last row = 2nd last row
      this.v[(this.numX - 1) * n + j] = this.v[(this.numX - 2) * n + j];
    }
  }

  solveIncompressibility(overRelaxation: number, numIters: number, dt: number) {
    const n = this.numY;
    const cp = (this.density * this.h) / dt;

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          if (this.s[i * n + j] == 0.0) continue;

          // s - # of NSEW obstacles
          // s_ij is 0 for obstacle, 1 for fluid
          const sx0 = this.s[(i - 1) * n + j];
          const sx1 = this.s[(i + 1) * n + j];
          const sy0 = this.s[i * n + j - 1];
          const sy1 = this.s[i * n + j + 1];
          const s = sx0 + sx1 + sy0 + sy1;
          if (s == 0.0) continue;

          // div - Total divergence of NSEW velocities
          // Note indicies are different from s,
          // b/c u & v are on the edges of each grid cell
          const div =
            this.u[(i + 1) * n + j] -
            this.u[i * n + j] +
            this.v[i * n + j + 1] -
            this.v[i * n + j];

          // dDiv - Average divergence of non-obstacle NSEW cells
          const dDiv = (-div / s) * overRelaxation;

          // u, v - Velocity
          // Note that if s_ij is an obstacle, its velocity doesn't change.
          this.u[i * n + j] -= sx0 * dDiv;
          this.u[(i + 1) * n + j] += sx1 * dDiv;
          this.v[i * n + j] -= sy0 * dDiv;
          this.v[i * n + j + 1] += sy1 * dDiv;

          // p - Pressure. Not needed for simulation.
          this.p[i * n + j] += cp * dDiv;
        }
      }
    }
  }

  // Average weighted velocity at position (x, y)
  sampleField(x: number, y: number, field: Field) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    const h2 = 0.5 * h;

    x = Math.max(Math.min(x, this.numX * h), h);
    y = Math.max(Math.min(y, this.numY * h), h);

    let dx = 0.0;
    let dy = 0.0;

    let f;

    switch (field) {
      case 'U_FIELD':
        f = this.u;
        dy = h2;
        break;
      case 'V_FIELD':
        f = this.v;
        dx = h2;
        break;
      case 'S_FIELD':
        f = this.m;
        dx = h2;
        dy = h2;
        break;
    }

    const x0 = Math.min(Math.floor((x - dx) * h1), this.numX - 1);
    const tx = (x - dx - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, this.numX - 1);

    const y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
    const ty = (y - dy - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, this.numY - 1);

    const sx = 1.0 - tx;
    const sy = 1.0 - ty;

    const val =
      sx * sy * f[x0 * n + y0] +
      tx * sy * f[x1 * n + y0] +
      tx * ty * f[x1 * n + y1] +
      sx * ty * f[x0 * n + y1];

    return val;
  }

  // Average horizontal velocity at index (i, j)
  avgU(i: number, j: number) {
    const n = this.numY;
    const u =
      (this.u[i * n + j - 1] +
        this.u[i * n + j] +
        this.u[(i + 1) * n + j - 1] +
        this.u[(i + 1) * n + j]) *
      0.25;
    return u;
  }

  // Average vertical velocity at index (i, j)
  avgV(i: number, j: number) {
    const n = this.numY;
    const v =
      (this.v[(i - 1) * n + j] +
        this.v[i * n + j] +
        this.v[(i - 1) * n + j + 1] +
        this.v[i * n + j + 1]) *
      0.25;
    return v;
  }

  // Set velocity to be the predicted velocity of a particle dt time
  // in the past, calculated by averaging neighbouring velocities.
  advectVel(dt: number) {
    this.newU.set(this.u);
    this.newV.set(this.v);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY; j++) {
        // u component (horizontal) -----------
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[(i - 1) * n + j] != 0.0 &&
          j < this.numY - 1
        ) {
          // position at index i,j
          const x = i * h;
          const y = j * h + h2;

          // velocity at index i,j
          const u = this.u[i * n + j];
          const v = this.avgV(i, j); // similar to this.sampleField(x, y, 'V_FIELD');

          // previous position, dt time ago
          const x0 = x - dt * u;
          const y0 = y - dt * v;

          //  weighted average of velocity at prev position
          const u0 = this.sampleField(x0, y0, 'U_FIELD');
          this.newU[i * n + j] = u0 * this.drag;
        }
        // v component (vertical) -----------
        // Same as above, but for v instead of u
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[i * n + j - 1] != 0.0 &&
          i < this.numX - 1
        ) {
          const x = i * h + h2;
          const y = j * h;
          const u = this.avgU(i, j); // similar to this.sampleField(x, y, 'U_FIELD');
          const v = this.v[i * n + j];
          const x0 = x - dt * u;
          const y0 = y - dt * v;
          const v0 = this.sampleField(x0, y0, 'V_FIELD');
          this.newV[i * n + j] = v0 * this.drag;
        }
      }
    }

    this.u.set(this.newU);
    this.v.set(this.newV);
  }

  // Similar to advectVel, but for smoke density.
  // New density is a weighted average of neighbouring smoke densities.
  advectSmoke(dt: number, smokeDissipation: number) {
    this.newM.set(this.m);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0) {
          const u = (this.u[i * n + j] + this.u[(i + 1) * n + j]) * 0.5;
          const v = (this.v[i * n + j] + this.v[i * n + j + 1]) * 0.5;
          const x = i * h + h2 - dt * u;
          const y = j * h + h2 - dt * v;
          this.newM[i * n + j] =
            this.sampleField(x, y, 'S_FIELD') * smokeDissipation;
        }
      }
    }
    this.m.set(this.newM);
  }

  simulate(s: Scene, dt: number) {
    this.integrate(dt, s.gravity);

    this.p.fill(0.0);
    this.solveIncompressibility(s.overRelaxation, s.numIters, dt);

    this.extrapolate();
    this.advectVel(dt);
    this.advectSmoke(dt, s.smokeDissipation);
  }
}
