import { Scene } from './FluidScene';

export function appendHTMLButtons(
  initialNum: number,
  rootElement: HTMLElement,
  getSceneConfig: (num: number) => Scene
) {
  const inputDiv = document.createElement('inputDiv') as HTMLCanvasElement;
  rootElement.append(inputDiv);
  const initialScene = getSceneConfig(initialNum);
  const setupScene = (num: number) => {
    const scene = getSceneConfig(num);
    inputDiv.innerHTML = '';
    appendButtonsForScene(inputDiv, scene, setupScene);
    return scene;
  };
  appendButtonsForScene(inputDiv, initialScene, setupScene);
  return initialScene;
}

function appendButtonsForScene(
  root: HTMLElement,
  scene: Scene,
  setupScene: (num: number) => void
) {
  const inputs = createInputs(scene, setupScene);
  root.append(
    //inputs.startButton,
    document.createElement('br'),
    document.createElement('br'),
    ...inputs.buttons,
    document.createElement('br'),
    inputs.checkboxes.stream,
    'Streamlines',
    inputs.checkboxes.velocity,
    'Velocity',
    inputs.checkboxes.pressure,
    'Pressure',
    inputs.checkboxes.smoke,
    'Smoke',
    inputs.checkboxes.overRelax,
    'Over Relaxation',
    document.createElement('br'),
    document.createTextNode('Shortcuts: P - Pause/Start, M - Step')
  );
}

function createInputs(scene: Scene, setupScene: (num: number) => void) {
  function updateInputs() {
    inputs.checkboxes.stream.checked = scene.showStreamlines;
    inputs.checkboxes.velocity.checked = scene.showVelocities;
    inputs.checkboxes.pressure.checked = scene.showPressure;
    inputs.checkboxes.smoke.checked = scene.showSmoke;
    inputs.checkboxes.overRelax.checked = scene.overRelaxation > 1.0;
    inputs.startButton.innerHTML = scene.paused ? 'Start' : 'Pause';
  }

  const inputs = {
    startButton: createButton(scene.paused ? 'Start' : 'Pause', () => {
      scene.paused = !scene.paused;
      updateInputs();
    }),
    buttons: [
      createButton('Wind Tunnel', () => {
        setupScene(1);
        updateInputs();
      }),
      createButton('Paint Tunnel', () => {
        setupScene(2);
        updateInputs();
      }),
      createButton('Tank Tunnel', () => {
        setupScene(0);
        updateInputs();
      }),
      createButton('Hires Tunnel', () => {
        setupScene(3);
        updateInputs();
      }),
    ],
    checkboxes: {
      stream: createCheckbox(scene.showStreamlines, () => {
        scene.showStreamlines = !scene.showStreamlines;
      }),
      velocity: createCheckbox(scene.showVelocities, () => {
        scene.showVelocities = !scene.showVelocities;
      }),
      pressure: createCheckbox(scene.showPressure, () => {
        scene.showPressure = !scene.showPressure;
      }),
      smoke: createCheckbox(scene.showSmoke, () => {
        scene.showSmoke = !scene.showSmoke;
      }),
      overRelax: createCheckbox(scene.overRelaxation > 1.0, () => {
        scene.overRelaxation = scene.overRelaxation == 1.0 ? 1.9 : 1.0;
      }),
    },
  };
  return inputs;
}

function createButton(text: string, onclick: () => void) {
  let button = document.createElement('button');
  button.innerText = text;
  button.onclick = onclick;
  return button;
}

function createCheckbox(
  checked: boolean,
  onclick: () => void
): HTMLInputElement {
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.onclick = onclick;
  checkbox.checked = checked;
  return checkbox;
}
