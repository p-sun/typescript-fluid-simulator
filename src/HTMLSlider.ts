export type SliderOptions = {
  min: number;
  max: number;
  initialValue: number;
  stepSize?: number;
  label?: string;
  appendToDomId?: string;
  callbackOnlyOnPointerUp?: boolean;
};

export class HTMLSlider {
  private didChange: (newValue: number) => void;
  private slider: HTMLInputElement;
  private text: HTMLInputElement;
  public container: HTMLDivElement;

  constructor(options: SliderOptions, didChange: (newValue: number) => void) {
    this.slider = this.createSlider(options);
    this.text = this.createText(options);
    this.container = this.createContainer(options, this.slider, this.text);
    this.didChange = didChange;
  }

  setValue(value: number) {
    this.slider.value = value.toString();
    this.text.value = value.toString();
  }

  createSlider(options: SliderOptions) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = options.min.toString();
    slider.max = options.max.toString();
    slider.value = options.initialValue.toString();
    slider.step = options.stepSize?.toString() ?? 'any';
    return slider;
  }

  createText(options: SliderOptions) {
    const text = document.createElement('input');
    text.style.width = '36px';
    text.value = options.initialValue.toString();
    return text;
  }

  createContainer(
    options: SliderOptions,
    slider: HTMLInputElement,
    text: HTMLInputElement
  ) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.backgroundColor = '#cfcfcf';
    container.style.padding = '4px';
    container.style.borderRadius = '4px';
    container.style.margin = '4px';

    if (options.label) {
      const label = document.createElement('div');
      label.innerText = options.label;
      label.style.marginRight = '8px';
      container.appendChild(label);
    }

    container.appendChild(text);
    container.appendChild(slider);

    slider.onpointerup = () => {
      const val = this.getValue(Number.parseFloat(slider.value), options);
      if (options.callbackOnlyOnPointerUp) this.didChange(val);
    };

    slider.oninput = () => {
      const val = this.getValue(Number.parseFloat(slider.value), options);
      text.value = val.toString();
      if (!options.callbackOnlyOnPointerUp) this.didChange(val);
    };

    text.oninput = () => {
      const val = this.getValue(Number.parseFloat(text.value), options);
      slider.value = val.toString();
      this.didChange(val);
    };
    text.onchange = () => {
      const val = this.getValue(Number.parseFloat(text.value), options);
      slider.value = val.toString();
      this.didChange(val);
    };

    if (options.appendToDomId) {
      document.getElementById(options.appendToDomId)?.appendChild(container);
    }
    return container;
  }

  getValue(v: number, options: SliderOptions) {
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
}
