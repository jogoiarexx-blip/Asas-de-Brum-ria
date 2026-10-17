/** Deterministic selection of projectile slots; independent from Three.js. */
export function projectileAdmission(projectiles,owner,cap){
  const limit=Math.max(0,Math.floor(Number.isFinite(cap)?cap:0));
  if(limit===0)return {allowed:false,evictIndex:-1};
  if(projectiles.length<limit)return {allowed:true,evictIndex:-1};
  // Enemy shots may never evict player shots. The player can evict one enemy
  // shot, preventing enemy spam from making the fire button unresponsive.
  if(owner!=='player')return {allowed:false,evictIndex:-1};
  const index=projectiles.findIndex(p=>p.owner==='enemy');
  return {allowed:index>=0,evictIndex:index};
}
