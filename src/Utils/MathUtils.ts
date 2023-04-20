export function remap(
  n: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number
) {
  const val = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  return clamp(val, start2, stop2);
}

export function clamp(n: number, min: number, max: number) {
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return Math.max(min, Math.min(max, n));
}
