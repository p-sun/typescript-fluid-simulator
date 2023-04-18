// Original: https://github.com/p-sun/typescript-fluid-simulator

import { createFluidSim } from './src/FluidSim';
import Vec2 from './src/Utils/Vec2';

const size = Math.min(window.innerWidth - 40, window.innerHeight - 180);
const fluidSim = createFluidSim({
  initialScene: 'Latte Scene',
  canvasDomId: 'myCanvas',
  buttonsDomId: 'inputDiv',
  canvasSize: new Vec2(size, size),
  resolutionOverride: undefined,
  autostart: true,
});
