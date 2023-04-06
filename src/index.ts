import { createFluidSim } from './FluidSim';

const INITIAL_SCENE = 1;
const fluidSim = createFluidSim(
  INITIAL_SCENE,
  document.getElementById('myCanvas') as HTMLCanvasElement,
  update
);

function update() {
  if (!fluidSim.scene.paused) {
    fluidSim.update();
    requestAnimationFrame(update);
  }
}
update();
