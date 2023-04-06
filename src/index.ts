import { createFluidSim } from './FluidSim';

const fluidSim = createFluidSim(
  'Paint Tunnel',
  document.getElementById('myCanvas') as HTMLCanvasElement
);

fluidSim.update();
