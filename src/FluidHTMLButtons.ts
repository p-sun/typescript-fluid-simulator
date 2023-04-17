import { Scene, TunnelType } from './FluidScene';
import { createSliderWithText } from './Utils/HTMLSlider';

export function inputsForScene(options: {
  scene: Scene;
  onPauseToggled: () => void;
  onObstacleChanged: () => void;
  onChangeScene: (tunnel: TunnelType, resOverride?: number) => void;
}): (string | HTMLElement)[] {
  const { scene, onPauseToggled, onObstacleChanged, onChangeScene } = options;
  const latteCheckbox =
    'Latte Tunnel' === scene.tunnel
      ? [
          createCheckbox('Latte Pen', scene.lattePen, () => {
            scene.lattePen = !scene.lattePen;
          }),
        ]
      : [];
  const latteSliders =
    scene.tunnel === 'Latte Tunnel'
      ? [
          createSliderWithText(
            {
              initialValue: scene.milkStartSpeed,
              min: 0,
              max: 1.2,
              stepSize: 0.001,
              label: 'Milk Speed',
              callbackOnlyOnPointerUp: false,
            },
            (val) => {
              scene.milkStartSpeed = val;
            }
          ),
          createSliderWithText(
            {
              initialValue: scene.milkTimeToZeroSpeed,
              min: 3,
              max: 18,
              stepSize: 0.1,
              label: 'Milk Time to 0 Speed',
              callbackOnlyOnPointerUp: true,
            },
            (val) => {
              scene.milkTimeToZeroSpeed = val;
            }
          ),
        ]
      : [];
  return [
    createBreak(),
    createButton(scene.paused ? 'Start' : 'Pause', (setText) => {
      setText(!scene.paused ? 'Start' : 'Pause');
      onPauseToggled();
    }),
    createButton('Wind Scene', () => {
      onChangeScene('Wind Tunnel');
    }),
    createButton('Paint Scene', () => {
      onChangeScene('Paint Tunnel');
    }),
    createButton('Tank Scene', () => {
      onChangeScene('Tank Tunnel');
    }),
    createButton('HiRes Scene', () => {
      onChangeScene('HiRes Tunnel');
    }),
    createButton('Latte Scene', () => {
      onChangeScene('Latte Tunnel');
    }),
    createBreak(),
    createCheckbox('Streamlines', scene.showStreamlines, () => {
      scene.showStreamlines = !scene.showStreamlines;
    }),
    createCheckbox('Velocity', scene.showVelocities, () => {
      scene.showVelocities = !scene.showVelocities;
    }),
    createCheckbox('Pressure', scene.showPressure, () => {
      scene.showPressure = !scene.showPressure;
    }),
    createCheckbox('Smoke', scene.showSmoke, () => {
      scene.showSmoke = !scene.showSmoke;
    }),
    createCheckbox('Obstacle', scene.showObstacle, () => {
      scene.showObstacle = !scene.showObstacle;
    }),
    createCheckbox('Solid', scene.showSolid, () => {
      scene.showSolid = !scene.showSolid;
    }),
    ...latteCheckbox,
    createBreak(),
    ...latteSliders,
    createSliderWithText(
      {
        initialValue: scene.obstacleRadius,
        min: 0.005,
        max: 0.2,
        stepSize: 0.005,
        label: 'Obstacle Radius',
        callbackOnlyOnPointerUp: false,
      },
      (radius) => {
        scene.obstacleRadius = radius;
        onObstacleChanged();
      }
    ),
    createSliderWithText(
      {
        initialValue: scene.overRelaxation,
        min: 0.05,
        max: 1.95,
        stepSize: 0.05,
        label: 'Over Relaxation',
        callbackOnlyOnPointerUp: false,
      },
      (val) => {
        scene.overRelaxation = val;
      }
    ),
    createSliderWithText(
      {
        initialValue: 1 - scene.smokeDissipation,
        min: 0,
        max: 0.01,
        stepSize: 0.001,
        label: 'Dissipation',
        callbackOnlyOnPointerUp: false,
      },
      (val) => {
        scene.smokeDissipation = 1 - val;
      }
    ),
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
    `Shortcuts: 'P' for Pause/Start, 'M' for Step Next Frame`,
    `\nLeft drag to pour "milk", right drag or check the "Latte Pen" checkbox to use the latte pen tool. Click "Latte Tunnel" to restart.`,
  ];
}

function createBreak() {
  const br = document.createElement('div');
  br.style.flexBasis = '100%';
  br.style.height = '4pt';
  return br;
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
  text: string,
  checked: boolean,
  fn: (setChecked: (checked: boolean) => void) => void
) {
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;

  const setChecked = (checked: boolean) => (checkbox.checked = checked);
  checkbox.onclick = () => fn(setChecked);

  const label = document.createElement('div');
  label.innerText = text;

  const container = document.createElement('div');
  container.appendChild(checkbox);
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.columnGap = '2px';

  container.appendChild(label);

  return container;
}
