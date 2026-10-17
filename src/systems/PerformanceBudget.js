/** Pure platform-independent budgets, never affect gameplay progress or saved games. */
const BUDGETS=Object.freeze({
  economy:{effects:14,projectiles:12,rain:48,hudInterval:.28},
  balanced:{effects:32,projectiles:20,rain:130,hudInterval:.16},
  quality:{effects:60,projectiles:28,rain:260,hudInterval:.11}
});
const get=tier=>BUDGETS[tier]??BUDGETS.balanced;
export const effectLimit=tier=>get(tier).effects;
export const projectileLimit=tier=>get(tier).projectiles;
export const weatherParticleLimit=tier=>get(tier).rain;
export const hudInterval=tier=>get(tier).hudInterval;
export const shouldThrottleHUD=(elapsed,tier)=>elapsed<hudInterval(tier);
