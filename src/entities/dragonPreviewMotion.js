/** Preview poses are isolated from the playable dragon.
 * None of these preview controls affect game physics or mission state. */
export const PREVIEW_MOTIONS=Object.freeze([
  {id:'idle',label:'Parado (Idle)'},
  {id:'walk',label:'Andar (Walk)'},
  {id:'fly',label:'Voar (Fly)'},
  {id:'glide',label:'Planar (Glide)'},
  {id:'attack',label:'Atacar (Attack)'},
  {id:'hurt',label:'Reagir (Hurt)'},
  {id:'takeoff',label:'Decolar (Takeoff)'},
  {id:'land',label:'Pousar (Landing)'}
]);
export function applyDragonPreviewMotion(dragon,id){
  if(!PREVIEW_MOTIONS.some(m=>m.id===id))return false;
  dragon.airborne=['fly','glide','attack','takeoff'].includes(id);
  dragon.riding=true;
  dragon.speed=id==='fly'?23:id==='glide'?6:id==='walk'?7:id==='attack'?15:0;
  dragon.pose=id==='takeoff'?'takeoff':id==='land'?'landing':
    dragon.airborne?'cruise':'ground';
  dragon.attackTime=id==='attack'?.35:0;
  dragon.hurtTime=id==='hurt'?.45:0;
  return true;
}
