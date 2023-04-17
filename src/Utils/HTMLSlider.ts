export type SliderOptions = {
  min: number;
  max: number;
  initialValue: number;
  stepSize?: number;
  label?: string;
  appendToDomId?: string;
  callbackOnlyOnPointerUp?: boolean;
};

export function createSliderWithText(
  options: SliderOptions,
  didChange: (newValue: number) => void
) {
  const slider = createSlider(options);
  const text = createText(options);
  return createContainer(options, slider, text, didChange);
}

function createSlider(options: SliderOptions) {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = options.min.toString();
  slider.max = options.max.toString();
  slider.step = options.stepSize?.toString() ?? 'any';
  slider.value = options.initialValue.toString();
  slider.style.flexGrow = '1';
  return slider;
}

function createText(options: SliderOptions) {
  const text = document.createElement('input');
  text.style.width = '36pt';
  text.value = options.initialValue.toString();
  return text;
}

function createContainer(
  options: SliderOptions,
  slider: HTMLInputElement,
  text: HTMLInputElement,
  didChange: (newValue: number) => void
) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.backgroundColor = '#cfcfcf';
  container.style.padding = '4pt';
  container.style.borderRadius = '4pt';
  container.style.flexGrow = '1';

  if (options.label) {
    const label = document.createElement('div');
    label.innerText = options.label;
    label.style.marginRight = '8pt';
    container.appendChild(label);
  }

  container.appendChild(text);
  container.appendChild(slider);

  slider.onpointerup = () => {
    const val = getValue(Number.parseFloat(slider.value), options);
    if (options.callbackOnlyOnPointerUp) didChange(val);
  };

  slider.oninput = () => {
    const val = getValue(Number.parseFloat(slider.value), options);
    text.value = val.toString();
    if (!options.callbackOnlyOnPointerUp) didChange(val);
  };

  text.oninput = () => {
    const val = getValue(Number.parseFloat(text.value), options);
    slider.value = val.toString();
    didChange(val);
  };

  text.onchange = () => {
    const val = getValue(Number.parseFloat(text.value), options);
    slider.value = val.toString();
    didChange(val);
  };

  if (options.appendToDomId) {
    document.getElementById(options.appendToDomId)?.appendChild(container);
  }
  return container;
}

function getValue(v: number, options: SliderOptions) {
  let value = v;

  value = Math.min(options.max, value);
  value = Math.max(options.min, value);

  // if (options.stepSize) {
  //   value -= ((value - options.min) % options.stepSize)
  // }

  const n = 10000;
  const r = Math.floor(value * n) / n;
  return r;
}
