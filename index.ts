import { createFluidSim } from './src/FluidSim';

const fluidSim = createFluidSim({
  initialTunnel: 'Wind Tunnel',
  canvasDomId: 'myCanvas',
  buttonsDomId: 'inputDiv',
  resolutionOverride: undefined,
  autostart: true,
});
