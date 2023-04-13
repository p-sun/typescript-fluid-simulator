import { createFluidSim } from './src/FluidSim';
import Vec2 from './src/Utils/Vec2';

const fluidSim = createFluidSim({
  initialTunnel: 'Wind Tunnel',
  canvasDomId: 'myCanvas',
  buttonsDomId: 'inputDiv',
  canvasSize: new Vec2(window.innerWidth - 80, window.innerHeight - 190),
  resolutionOverride: undefined,
  autostart: true,
});
