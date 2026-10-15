export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function approach(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
export function smoothFollow(rate, dt) { return 1 - Math.exp(-rate * dt); }
export function distance2D(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
export function seededRandom(seed = 123456) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
}
export function forwardFromYaw(yaw) { return { x: -Math.sin(yaw), z: -Math.cos(yaw) }; }
