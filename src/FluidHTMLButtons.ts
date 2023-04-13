import { Scene, TunnelType } from './FluidScene';
import { createSliderWithText } from './Utils/HTMLSlider';

export function inputsForScene(options: {
  scene: Scene;
  onPauseToggled: () => void;
  onObstacleChanged: () => void;
  onChangeScene: (tunnel: TunnelType, resOverride?: number) => void;
}): (string | HTMLElement)[] {
  const { scene, onPauseToggled, onObstacleChanged, onChangeScene } = options;
  return [
    createButton('Wind Tunnel', () => {
      onChangeScene('Wind Tunnel');
    }),
    createButton('Paint Tunnel', () => {
      onChangeScene('Paint Tunnel');
    }),
    createButton('Tank Tunnel', () => {
      onChangeScene('Tank Tunnel');
    }),
    createButton('HiRes Tunnel', () => {
      onChangeScene('HiRes Tunnel');
    }),
    createButton(scene.paused ? 'Start' : 'Pause', (setText) => {
      setText(!scene.paused ? 'Start' : 'Pause');
      onPauseToggled();
    }),
    document.createElement('br'),
    createCheckbox(scene.showStreamlines, () => {
      scene.showStreamlines = !scene.showStreamlines;
    }),
    'Streamlines',
    createCheckbox(scene.showVelocities, () => {
      scene.showVelocities = !scene.showVelocities;
    }),
    'Velocity',
    createCheckbox(scene.showPressure, () => {
      scene.showPressure = !scene.showPressure;
    }),
    'Pressure',
    createCheckbox(scene.showSmoke, () => {
      scene.showSmoke = !scene.showSmoke;
    }),
    'Smoke',
    createCheckbox(scene.showObstacle, () => {
      scene.showObstacle = !scene.showObstacle;
    }),
    'Obstacle',
    createCheckbox(scene.showSolid, () => {
      scene.showSolid = !scene.showSolid;
    }),
    'Solid',
    createCheckbox(scene.overRelaxation > 1.0, () => {
      scene.overRelaxation = scene.overRelaxation == 1.0 ? 1.9 : 1.0;
    }),
    'Over Relaxation',
    createSliderWithText(
      {
        initialValue: scene.fluid.numY,
        min: 10,
        max: 200,
        stepSize: 10,
        label: 'Resolution',
        callbackOnlyOnPointerUp: true,
      },
      (resOverride) => {
        onChangeScene(scene.tunnel, resOverride > 0 ? resOverride : undefined);
      }
    ),
    createSliderWithText(
      {
        initialValue: scene.obstacleRadius,
        min: 0.01,
        max: 0.2,
        stepSize: 0.01,
        label: 'Obstacle Radius',
        callbackOnlyOnPointerUp: false,
      },
      (radius) => {
        scene.obstacleRadius = radius;
        onObstacleChanged();
      }
    ),
    `Keyboard Shortcuts: 'P' for Pause/Start, 'M' for Step Next Frame`,
  ];
}

function createButton(
  text: string,
  fn: (setText: (text: string) => void) => void
) {
  let button = document.createElement('button');
  button.innerText = text;

  const setText = (text: string) => (button.innerText = text);
  button.onclick = () => fn(setText);

  return button;
}

function createCheckbox(
  checked: boolean,
  fn: (setChecked: (checked: boolean) => void) => void
): HTMLInputElement {
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;

  const setChecked = (checked: boolean) => (checkbox.checked = checked);
  checkbox.onclick = () => fn(setChecked);

  return checkbox;
}
