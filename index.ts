import { createFluidSim } from './src/FluidSim';

const fluidSim = createFluidSim(
  'Paint Tunnel',
  document.getElementById('myCanvas') as HTMLCanvasElement,
  document.getElementById('inputButtons') as HTMLCanvasElement
);

fluidSim.update();
