// Original: https://github.com/p-sun/typescript-fluid-simulator

import { createFluidSim } from './src/FluidSim';
import Vec2 from './src/Utils/Vec2';

const fluidSim = createFluidSim({
  initialSceneTag: 'Latte Scene',
  canvasDomId: 'myCanvas',
  inputDomId: 'inputDiv',
  canvasSize: new Vec2(window.innerWidth - 42, window.innerHeight - 180),
  autostart: true,
  overrides: {},
});
