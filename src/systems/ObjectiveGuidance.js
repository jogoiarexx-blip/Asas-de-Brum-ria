/** A lightweight, geometry-independent compass for quests and daily contracts. */
const wrapAngle=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
export function objectiveGuidance(position,target,yaw=0){
  if(!position||!target)return null;
  const dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z;
  if(![dx,dy,dz].every(Number.isFinite))return null;
  const horizontalDistance=Math.hypot(dx,dz);
  const distance=Math.round(Math.hypot(horizontalDistance,dy));
  const targetHeading=Math.atan2(-dx,-dz);
  const angle=wrapAngle(targetHeading-(Number.isFinite(yaw)?yaw:0));
  const abs=Math.abs(angle);
  let direction,arrow;
  if(abs<Math.PI/7){direction='FRENTE';arrow='↑';}
  else if(abs>Math.PI*6/7){direction='ATRÁS';arrow='↓';}
  else if(angle>0){direction='ESQUERDA';arrow='←';}
  else{direction='DIREITA';arrow='→';}
  const altitudeHint=dy>8?`SUBA ${Math.round(dy)} m`:dy< -8?`DESÇA ${Math.round(-dy)} m`:'';
  return {direction,arrow,distance,horizontalDistance:Math.round(horizontalDistance),altitudeHint,near:distance<12};
}
export function missionObjectiveName(stage,carrying=false,mountain=false,expeditionPhase='boats'){
  if(mountain)return expeditionPhase==='boats'?'BARCO INIMIGO':expeditionPhase==='boss'?'DRAGÃO GIGANTE':'PORTAL DE RETORNO';
  return ['DRAGÃO NIMBO','PRÓXIMO ARO','CRISTAL','ORBE SOMBRIO','SENTINELA INIMIGA',carrying?'SANTUÁRIO DOS FILHOTES':'FILHOTE PERDIDO','VILA · ESTÁBULO'][stage]??'PATRULHA';
}
