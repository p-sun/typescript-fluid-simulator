import { Scene, SceneConfig, SceneTag } from './FluidScene';
import { createSliderWithText } from './Utils/HTMLSlider';

export function inputsForScene(options: {
  scene: Scene;
  onPauseToggled: () => void;
  onObstacleChanged: () => void;
  onChangeOverrides: (newOverrides: Partial<SceneConfig>) => void;
  onChangeScene: (tag: SceneTag, clearOverrides: boolean) => void;
}): (string | HTMLElement)[] {
  const {
    scene,
    onPauseToggled,
    onObstacleChanged,
    onChangeScene,
    onChangeOverrides,
  } = options;

  let inputs: (string | HTMLElement)[] = [
    createBreak(),
    createButton(scene.paused ? 'Start' : 'Pause', (setText) => {
      setText(!scene.paused ? 'Start' : 'Pause');
      onPauseToggled();
    }),
    createButton('Clear', () => {
      onChangeScene(scene.tag, false);
    }),
    createButton('Wind scene', () => {
      onChangeScene('Wind Scene', true);
    }),
    createButton('Paint scene', () => {
      onChangeScene('Paint Scene', true);
    }),
    createButton('Tank scene', () => {
      onChangeScene('Tank Scene', true);
    }),
    createButton('HiRes scene', () => {
      onChangeScene('HiRes Scene', true);
    }),
  ];

  inputs.push(createBreak());

  inputs.push(
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
    })
  );

  inputs.push(createBreak());

  inputs.push(
    createSliderWithText(
      {
        initialValue: scene.obstacleRadius,
        min: 0.005,
        max: 0.2,
        stepSize: 0.005,
        label: 'Obstacle radius',
        callbackOnlyOnPointerUp: false,
      },
      (val) => {
        scene.obstacleRadius = val;
        onChangeOverrides({ obstacleRadius: val });
        onObstacleChanged();
      }
    )
  );

  inputs.push(
    createSliderWithText(
      {
        initialValue: scene.overRelaxation,
        min: 0.05,
        max: 1.95,
        stepSize: 0.05,
        label: 'Over relaxation',
        callbackOnlyOnPointerUp: false,
      },
      (val) => {
        scene.overRelaxation = val;
        onChangeOverrides({ overRelaxation: val });
      }
    ),
    // createSliderWithText(
    //   {
    //     initialValue: 1 - scene.smokeDissipation,
    //     min: 0,
    //     max: 0.01,
    //     stepSize: 0.001,
    //     label: 'Dissipation',
    //     callbackOnlyOnPointerUp: false,
    //   },
    //   (val) => {
    //     scene.smokeDissipation = 1 - val;
    //   }
    // ),
    createSliderWithText(
      {
        initialValue: scene.fluid.numY,
        min: 10,
        max: 200,
        stepSize: 10,
        label: 'Resolution',
        callbackOnlyOnPointerUp: true,
      },
      (resolution) => {
        onChangeOverrides({ resolution });
        onChangeScene(scene.tag, false);
      }
    ),
    `Shortcuts: 'P' for Pause/Start, 'M' for Step Next Frame`
  );

  return inputs;
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
