import { Scene, SceneConfig, SceneTag } from './FluidScene';
import { createSliderWithText } from './Utils/HTMLSlider';

export function inputsForScene(options: {
  scene: Scene;
  onObstacleChanged: () => void;
  onKeyPress: (key: string) => void;
  onChangeOverrides: (newOverrides: Partial<SceneConfig>) => void;
  onChangeScene: (tag: SceneTag) => void;
  updateInputs: () => void;
}): (string | HTMLElement)[] {
  const {
    scene,
    onObstacleChanged,
    onKeyPress,
    onChangeScene,
    onChangeOverrides,
    updateInputs,
  } = options;

  let inputs: (string | HTMLElement)[] = [
    createBreak(),
    createButton('Clear', () => {
      onKeyPress('c');
    }),
  ];

  if (scene.tag === 'Latte Scene') {
    inputs.push(
      createRadioInput('Pen', scene.tool === 'Latte Pen', () => {
        scene.tool = 'Latte Pen';
        updateInputs();
      }),
      createRadioInput('Milk', scene.tool === 'Milk', () => {
        scene.tool = 'Milk';
        updateInputs();
      }),
      createRadioInput('Spoon', scene.tool === 'Spoon', () => {
        scene.tool = 'Spoon';
        updateInputs();
      }),
      createRadioInput('Chocolate', scene.tool === 'Chocolate', () => {
        scene.tool = 'Chocolate';
        updateInputs();
      })
    );
  }

  inputs.push(createBreak());

  inputs.push(
    createSliderWithText(
      {
        initialValue: scene.obstacleRadius,
        min: 0.005,
        max: scene.tag === 'Latte Scene' ? 0.1 : 0.2,
        stepSize: 0.005,
        label: scene.tag === 'Latte Scene' ? 'Milk radius' : 'Obstacle radius',
        callbackOnlyOnPointerUp: false,
      },
      (val) => {
        scene.obstacleRadius = val;
        onChangeOverrides({ obstacleRadius: val });
        onObstacleChanged();
      }
    )
  );

  if (scene.tag === 'Latte Scene') {
    inputs.push(
      createSliderWithText(
        {
          initialValue: scene.timeToMinObstacleRadius,
          min: 0,
          max: 25,
          stepSize: 0.1,
          label: 'Time to min radius',
          callbackOnlyOnPointerUp: true,
        },
        (val) => {
          scene.timeToMinObstacleRadius = val;
          onChangeOverrides({ timeToMinObstacleRadius: val });
        }
      )
    );
  }

  if (scene.tag === 'Latte Scene') {
    inputs.push(
      createSliderWithText(
        {
          initialValue: scene.milkStartSpeed,
          min: 0,
          max: 1.2,
          stepSize: 0.001,
          label: 'Milk speed',
          callbackOnlyOnPointerUp: true,
        },
        (val) => {
          scene.milkStartSpeed = val;
          onChangeOverrides({ milkStartSpeed: val });
        }
      ),
      createSliderWithText(
        {
          initialValue: scene.timeToZeroMilkSpeed,
          min: 0,
          max: 18,
          stepSize: 0.1,
          label: 'Time to 0 milk speed',
          callbackOnlyOnPointerUp: true,
        },
        (val) => {
          scene.timeToZeroMilkSpeed = val;
          onChangeOverrides({ timeToZeroMilkSpeed: val });
        }
      ),
      createSliderWithText(
        {
          initialValue: scene.chocolateRadius,
          min: 0.005,
          max: 0.1,
          stepSize: 0.001,
          label: 'Chocolate radius',
          callbackOnlyOnPointerUp: true,
        },
        (val) => {
          scene.chocolateRadius = val;
          onChangeOverrides({ chocolateRadius: val });
        }
      ),
      createSliderWithText(
        {
          initialValue: scene.lattePenRadius,
          min: 0.005,
          max: 0.02,
          stepSize: 0.001,
          label: 'Latte Pen radius',
          callbackOnlyOnPointerUp: true,
        },
        (val) => {
          scene.lattePenRadius = val;
          onChangeOverrides({ lattePenRadius: val });
        }
      )
    );
  }

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
        onKeyPress('c');
      }
    )
  );

  inputs.push(
    createBreak(),
    createDivider(),
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
    })
  );

  inputs.push(
    createBreak(),
    createButton(scene.paused ? 'Start (P)' : 'Pause (P)', () => {
      onKeyPress('p');
    }),
    createButton('Next Frame (N)', () => {
      onKeyPress('n');
    }),
    createButton('Latte scene', () => {
      onChangeScene('Latte Scene');
    }),
    createButton('Wind scene', () => {
      onChangeScene('Wind Scene');
    }),
    createButton('Paint scene', () => {
      onChangeScene('Paint Scene');
    }),
    createButton('Tank scene', () => {
      onChangeScene('Tank Scene');
    }),
    createButton('HiRes scene', () => {
      onChangeScene('HiRes Scene');
    })
  );

  if (scene.tag === 'Latte Scene') {
    inputs.push(
      `\nLeft drag to pour "milk", right drag or check the "Latte pen tool" checkbox.`
    );
  }

  return inputs;
}

function createDivider() {
  const br = document.createElement('div');
  br.style.flexBasis = '100%';
  br.style.height = '2px';
  br.style.backgroundColor = 'lightGray';
  return br;
}

function createBreak() {
  const br = document.createElement('div');
  br.style.flexBasis = '100%';
  br.style.height = '4px';
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
  return createInput(text, checked, 'checkbox', fn);
}
function createRadioInput(
  text: string,
  checked: boolean,
  fn: (setChecked: (checked: boolean) => void) => void
) {
  return createInput(text, checked, 'radio', fn);
}

function createInput(
  text: string,
  checked: boolean,
  type: 'checkbox' | 'radio',
  fn: (setChecked: (checked: boolean) => void) => void
) {
  let checkbox = document.createElement('input');
  checkbox.type = type;
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
