/** Stable, allocation-light variety for the island's existing instanced trees.
 * No random-stream consumption: saves, placement and collision stay unchanged.
 */
const fract=value=>value-Math.floor(value);
const hash=(x,z,seed=0)=>fract(Math.sin(x*12.9898+z*78.233+seed*37.719)*43758.5453);

export function treeVariant(tree){
  const x=Number.isFinite(tree?.x)?tree.x:0;
  const z=Number.isFinite(tree?.z)?tree.z:0;
  const palette=Number.isFinite(tree?.palette)?tree.palette:0;
  const n=hash(x,z,palette);
  return {
    kind:n>.53?'broadleaf':'conifer',
    yaw:hash(x,z,12)*Math.PI*2,
    fullness:.87+hash(x,z,25)*.29,
    offset:hash(x,z,43)*2-1,
  };
}

/** Local canopy transform, relative to the trunk base and original tree size. */
export function treeCrownPose(tree,layer=0){
  const variant=treeVariant(tree);
  const top=layer===1;
  if(variant.kind==='conifer'){
    return {kind:variant.kind,dx:variant.offset*.12,dz:-variant.offset*.09,
      y:top?4.48:3.12,
      sx:variant.fullness*(top?.80:1),sy:top?.93:1.02,sz:variant.fullness*(top?.82:1),
      yaw:variant.yaw};
  }
  return {kind:variant.kind,dx:variant.offset*(top?.29:.13),dz:variant.offset*(top?-.17:.10),
    y:top?4.46:3.58,
    sx:variant.fullness*(top?.79:1.20),sy:top?.83:1.05,sz:variant.fullness*(top?.88:1.10),
    yaw:variant.yaw};
}
