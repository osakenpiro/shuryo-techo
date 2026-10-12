// An isolated comparison model. No production input, save, or physics state.
export const PULL_FEEL = Object.freeze({ softStart: .28, softRange: .22,
  riskStart: .42, riskRange: .20, yawAmplitude: 3, sideAmplitude: 2.5, frequency: 1.8 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rounded = (value, step) => {const reciprocal=1/step;return Math.round(value*reciprocal)/reciprocal;};
export function elasticDistance(distance) {
  if (!Number.isFinite(distance)) return 0;
  const d = Math.max(0, distance);
  return d <= PULL_FEEL.softStart ? d : PULL_FEEL.softStart + PULL_FEEL.softRange *
    (1 - Math.exp(-(d - PULL_FEEL.softStart) / PULL_FEEL.softRange));
}
export function pullAim({right = 0, up = 0, size = 1, mode = 'A', projection = '3d',
  elevation = 48, baseYaw = 0, elapsedSeconds = 0} = {}) {
  if (![right, up, size, elevation, baseYaw, elapsedSeconds].every(Number.isFinite) || size <= 0) {
    return {valid: false, rawDistance: 0, effectiveDistance: 0, risk: 0,
      base: {power: 4, elevation: 48, yaw: 0}, actual: {power: 4, elevation: 48, yaw: 0},
      delta: {yaw: 0, elevation: 0}, riskAmplitude: 0};
  }
  const side = projection === '2d', rawDistance = side ? Math.hypot(right, up) / size : Math.max(0, up / size);
  const effectiveDistance = mode === 'B' || mode === 'C' ? elasticDistance(rawDistance) : rawDistance;
  const base = side ? {
    power: rounded(clamp(.5 + 27 * effectiveDistance, .5, 14), .05),
    elevation: rounded(clamp(Math.atan2(up, right) * 180 / Math.PI, 5, 85), .5), yaw: 0,
  } : {
    power: rounded(clamp(4 + effectiveDistance * 18, 4, 13), .05),
    elevation: clamp(elevation, 15, 75), yaw: rounded(clamp(right / size * 60 + baseYaw, -60, 60), .5),
  };
  const risk = mode === 'C' ? clamp((rawDistance - PULL_FEEL.riskStart) / PULL_FEEL.riskRange, 0, 1) : 0;
  const riskAmplitude = risk * (side ? PULL_FEEL.sideAmplitude : PULL_FEEL.yawAmplitude);
  // Absolute elapsed gesture time, never frame count or pointer sampling. Holding
  // changes phase only; returning inside the boundary immediately removes wobble.
  const wobble = rounded(riskAmplitude * Math.sin(2 * Math.PI * PULL_FEEL.frequency * Math.max(0, elapsedSeconds)), .1);
  const actual = {...base, ...(side ? {elevation: clamp(base.elevation + wobble, 5, 85)} : {yaw: clamp(base.yaw + wobble, -60, 60)})};
  const valid = side ? right >= 0 && up >= 0 && Math.hypot(right, up) >= Math.max(8, size * .035) : up / size >= .10;
  return {valid, rawDistance, effectiveDistance, risk, riskAmplitude, base, actual,
    delta: {yaw: actual.yaw - base.yaw, elevation: actual.elevation - base.elevation}};
}
