import { Scene, TunnelType } from './FluidScene';
import { HTMLSlider } from './HTMLSlider';

type SetupSceneFn = (tunnel: TunnelType, numY: number) => Scene;

export function appendHTMLButtons(
  sceneChoice: TunnelType,
  rootElement: HTMLElement,
  getSceneConfig: SetupSceneFn
) {
  const inputDiv = document.createElement('inputDiv') as HTMLCanvasElement;
  rootElement.append(inputDiv);
  const initialScene = getSceneConfig(sceneChoice, 0);
  const setupScene: SetupSceneFn = (tunnel, numY) => {
    const scene = getSceneConfig(tunnel, numY);
    inputDiv.innerHTML = '';
    createButtonsForScene(inputDiv, scene, setupScene);
    return scene;
  };
  createButtonsForScene(inputDiv, initialScene, setupScene);
  return initialScene;
}

function createButtonsForScene(
  root: HTMLElement,
  scene: Scene,
  setupScene: SetupSceneFn
) {
  const inputs = createInputs(scene, setupScene);
  root.append(
    //inputs.startButton,
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
    inputs.checkboxes.obstacle,
    'Obstacle',
    inputs.checkboxes.overRelax,
    'Over Relaxation',
    inputs.resolutionSlider.container,
    document.createTextNode('Shortcuts: P - Pause/Start, M - Step')
  );
}

function createInputs(scene: Scene, setupScene: SetupSceneFn) {
  function updateInputs() {
    inputs.checkboxes.stream.checked = scene.showStreamlines;
    inputs.checkboxes.velocity.checked = scene.showVelocities;
    inputs.checkboxes.pressure.checked = scene.showPressure;
    inputs.checkboxes.smoke.checked = scene.showSmoke;
    inputs.checkboxes.overRelax.checked = scene.overRelaxation > 1.0;
    inputs.checkboxes.obstacle.checked = scene.showObstacle;
    inputs.startButton.innerHTML = scene.paused ? 'Start' : 'Pause';
    inputs.resolutionSlider.setValue(scene.fluid.numY);
  }

  const inputs = {
    startButton: createButton(scene.paused ? 'Start' : 'Pause', () => {
      scene.paused = !scene.paused;
      updateInputs();
    }),
    buttons: [
      createButton('Wind Tunnel', () => {
        setupScene('Wind Tunnel', 0);
        updateInputs();
      }),
      createButton('Paint Tunnel', () => {
        setupScene('Paint Tunnel', 0);
        updateInputs();
      }),
      createButton('Tank Tunnel', () => {
        setupScene('Tank Tunnel', 0);
        updateInputs();
      }),
      createButton('HiRes Tunnel', () => {
        setupScene('HiRes Tunnel', 0);
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
      obstacle: createCheckbox(scene.showObstacle, () => {
        scene.showObstacle = !scene.showObstacle;
      }),
      overRelax: createCheckbox(scene.overRelaxation > 1.0, () => {
        scene.overRelaxation = scene.overRelaxation == 1.0 ? 1.9 : 1.0;
      }),
    },
    resolutionSlider: new HTMLSlider(
      {
        initialValue: scene.fluid.numY,
        min: 10,
        max: 200,
        stepSize: 10,
        label: 'Resolution',
        callbackOnlyOnPointerUp: true,
      },
      (newValue) => {
        setupScene(scene.tunnel, newValue);
        updateInputs();
      }
    ),
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
