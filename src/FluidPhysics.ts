import { Scene } from './FluidScene';

type Field = 'U_FIELD' | 'V_FIELD' | 'S_FIELD';

export class FluidPhysics {
  density: number;

  // Grid Sizes
  numX: number;
  numY: number;
  numCells: number; // Total number of cells
  h: number; // Height of each cell

  // Per Pixel
  u: Float32Array;
  v: Float32Array;
  newU: Float32Array;
  newV: Float32Array;
  p: Float32Array;
  s: Float32Array;
  m: Float32Array;
  newM: Float32Array;

  constructor(density: number, numX: number, numY: number, h: number) {
    this.density = density;
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
    let n = this.numY;
    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0)
          this.v[i * n + j] += gravity * dt;
      }
    }
  }

  solveIncompressibility(scene: Scene, numIters: number, dt: number) {
    let n = this.numY;
    let cp = (this.density * this.h) / dt;

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          if (this.s[i * n + j] == 0.0) continue;

          let s = this.s[i * n + j];
          const sx0 = this.s[(i - 1) * n + j];
          const sx1 = this.s[(i + 1) * n + j];
          const sy0 = this.s[i * n + j - 1];
          const sy1 = this.s[i * n + j + 1];

          s = sx0 + sx1 + sy0 + sy1;
          if (s == 0.0) continue;

          let div =
            this.u[(i + 1) * n + j] -
            this.u[i * n + j] +
            this.v[i * n + j + 1] -
            this.v[i * n + j];

          let p = -div / s;
          p *= scene.overRelaxation;
          this.p[i * n + j] += cp * p;

          this.u[i * n + j] -= sx0 * p;
          this.u[(i + 1) * n + j] += sx1 * p;
          this.v[i * n + j] -= sy0 * p;
          this.v[i * n + j + 1] += sy1 * p;
        }
      }
    }
  }

  extrapolate() {
    let n = this.numY;
    for (let i = 0; i < this.numX; i++) {
      this.u[i * n + 0] = this.u[i * n + 1];
      this.u[i * n + this.numY - 1] = this.u[i * n + this.numY - 2];
    }
    for (let j = 0; j < this.numY; j++) {
      this.v[0 * n + j] = this.v[1 * n + j];
      this.v[(this.numX - 1) * n + j] = this.v[(this.numX - 2) * n + j];
    }
  }

  sampleField(x: number, y: number, field: Field) {
    let n = this.numY;
    let h = this.h;
    let h1 = 1.0 / h;
    let h2 = 0.5 * h;

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

    let x0 = Math.min(Math.floor((x - dx) * h1), this.numX - 1);
    let tx = (x - dx - x0 * h) * h1;
    let x1 = Math.min(x0 + 1, this.numX - 1);

    let y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
    let ty = (y - dy - y0 * h) * h1;
    let y1 = Math.min(y0 + 1, this.numY - 1);

    let sx = 1.0 - tx;
    let sy = 1.0 - ty;

    let val =
      sx * sy * f[x0 * n + y0] +
      tx * sy * f[x1 * n + y0] +
      tx * ty * f[x1 * n + y1] +
      sx * ty * f[x0 * n + y1];

    return val;
  }

  avgU(i: number, j: number) {
    let n = this.numY;
    let u =
      (this.u[i * n + j - 1] +
        this.u[i * n + j] +
        this.u[(i + 1) * n + j - 1] +
        this.u[(i + 1) * n + j]) *
      0.25;
    return u;
  }

  avgV(i: number, j: number) {
    let n = this.numY;
    let v =
      (this.v[(i - 1) * n + j] +
        this.v[i * n + j] +
        this.v[(i - 1) * n + j + 1] +
        this.v[i * n + j + 1]) *
      0.25;
    return v;
  }

  advectVel(dt: number) {
    this.newU.set(this.u);
    this.newV.set(this.v);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY; j++) {
        // u component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[(i - 1) * n + j] != 0.0 &&
          j < this.numY - 1
        ) {
          let x = i * h;
          let y = j * h + h2;
          let u = this.u[i * n + j];
          let v = this.avgV(i, j);
          //						let v = this.sampleField(x,y, 'V_FIELD');
          x = x - dt * u;
          y = y - dt * v;
          u = this.sampleField(x, y, 'U_FIELD');
          this.newU[i * n + j] = u;
        }
        // v component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[i * n + j - 1] != 0.0 &&
          i < this.numX - 1
        ) {
          let x = i * h + h2;
          let y = j * h;
          let u = this.avgU(i, j);
          //						let u = this.sampleField(x,y, 'U_FIELD');
          let v = this.v[i * n + j];
          x = x - dt * u;
          y = y - dt * v;
          v = this.sampleField(x, y, 'V_FIELD');
          this.newV[i * n + j] = v;
        }
      }
    }

    this.u.set(this.newU);
    this.v.set(this.newV);
  }

  advectSmoke(dt: number) {
    this.newM.set(this.m);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0) {
          let u = (this.u[i * n + j] + this.u[(i + 1) * n + j]) * 0.5;
          let v = (this.v[i * n + j] + this.v[i * n + j + 1]) * 0.5;
          let x = i * h + h2 - dt * u;
          let y = j * h + h2 - dt * v;

          this.newM[i * n + j] = this.sampleField(x, y, 'S_FIELD');
        }
      }
    }
    this.m.set(this.newM);
  }

  simulate(scene: Scene, dt: number, gravity: number, numIters: number) {
    this.integrate(dt, gravity);

    this.p.fill(0.0);
    this.solveIncompressibility(scene, numIters, dt);

    this.extrapolate();
    this.advectVel(dt);
    this.advectSmoke(dt);
  }
}
