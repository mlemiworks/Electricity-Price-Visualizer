const RAMP_STOPS = [
  'oklch(0.72 0.18 145)',
  'oklch(0.78 0.18 130)',
  'oklch(0.85 0.16 110)',
  'oklch(0.86 0.17 95)',
  'oklch(0.80 0.18 70)',
  'oklch(0.72 0.20 40)',
  'oklch(0.63 0.22 25)',
  'oklch(0.55 0.24 15)',
  'oklch(0.48 0.22 355)',
  'oklch(0.45 0.20 330)',
  'oklch(0.42 0.18 310)',
  'oklch(0.38 0.15 295)',
];

function colorForPrice(price, min, max) {
  if (typeof price !== 'number' || max <= min) return RAMP_STOPS[0];
  const t = Math.max(0, Math.min(1, (price - min) / (max - min)));
  const scaled = t * (RAMP_STOPS.length - 1);
  const i = Math.floor(scaled);
  const j = Math.min(i + 1, RAMP_STOPS.length - 1);
  const f = scaled - i;
  return `color-mix(in oklch, ${RAMP_STOPS[i]} ${Math.round((1 - f) * 100)}%, ${RAMP_STOPS[j]})`;
}

const SCALE_STEPS = [5, 10, 20, 30, 50, 100, 200, 500];

function dynamicMax(prices) {
  const valid = prices.filter(p => typeof p === 'number');
  if (!valid.length) return 10;
  const m = Math.max(...valid);
  for (const s of SCALE_STEPS) if (m <= s) return s;
  return SCALE_STEPS[SCALE_STEPS.length - 1];
}

function priceColor(price, mode = 'absolute', prices = []) {
  if (mode === 'relative') {
    const valid = prices.filter(p => typeof p === 'number');
    return colorForPrice(price, Math.min(...valid), Math.max(...valid));
  }
  return colorForPrice(price, 0, dynamicMax(prices));
}

function priceNorm(price, prices = []) {
  const max = dynamicMax(prices);
  return Math.max(0, Math.min(1, price / max));
}

export { RAMP_STOPS, colorForPrice, SCALE_STEPS, dynamicMax, priceColor, priceNorm };
