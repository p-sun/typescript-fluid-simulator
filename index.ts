import { createFluidSim } from './src/FluidSim';

const fluidSim = createFluidSim({
  initialTunnel: 'Wind Tunnel',
  canvasDomId: 'myCanvas',
  buttonsDomId: 'inputButtons',
});

fluidSim.update();
