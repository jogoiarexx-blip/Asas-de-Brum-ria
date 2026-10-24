import * as THREE from 'three';

/** Retarget riding animations onto existing Mixamo-like bones without remeshing.
 * Keeps every authored clip intact; generates only missing compatible clips.
 */
const BONES={
  hips:'mixamorig:Hips',spine:'mixamorig:Spine',spine1:'mixamorig:Spine1',
  chest:'mixamorig:Spine2',neck:'mixamorig:Neck',head:'mixamorig:Head',
  lthigh:'mixamorig:LeftUpLeg',rthigh:'mixamorig:RightUpLeg',
  lknee:'mixamorig:LeftLeg',rknee:'mixamorig:RightLeg',
  lfoot:'mixamorig:LeftFoot',rfoot:'mixamorig:RightFoot',
  larm:'mixamorig:LeftArm',rarm:'mixamorig:RightArm',
  lelbow:'mixamorig:LeftForeArm',relbow:'mixamorig:RightForeArm',
  lhand:'mixamorig:LeftHand',rhand:'mixamorig:RightHand'
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const scale=(p,f=1)=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v.map(n=>n*f)]));
export function riderBoneNames(){return Object.values(BONES);}

function seated(t,strength=1){
  const wave=Math.sin(Math.PI*2*t);
  return scale({
    hips:[7,0,2*wave],spine:[-8,0,-3*wave],spine1:[-8,0,1.5*wave],
    chest:[6,0,-wave],neck:[5,0,0],head:[0,2*wave,0],
    lthigh:[-62,0,-8],rthigh:[-62,0,8],lknee:[78,0,0],rknee:[78,0,0],
    lfoot:[-14,0,0],rfoot:[-14,0,0],
    larm:[-42,-6,-9],rarm:[-42,6,9],
    lelbow:[-44,0,0],relbow:[-44,0,0],
    lhand:[-8,0,0],rhand:[-8,0,0]
  },strength);
}
function flying(t,flapping=true){
  const p=seated(t),wave=Math.sin(Math.PI*2*t);
  p.chest=[-13-(flapping?3*wave:0),0,-3*wave];
  p.spine1=[-11,0,-2*wave];p.hips=[10,0,2*wave];
  p.head=[8,0,-3*wave];
  p.larm=[-45+(flapping?8*wave:0),-10,-14];
  p.rarm=[-45+(flapping?8*wave:0),10,14];
  p.lelbow=[-55+4*wave,0,0];p.relbow=[-55+4*wave,0,0];
  return p;
}
export const RIDER_CLIPS=Object.freeze({
  Idle:[3,t=>({spine:[-1,0,0],chest:[Math.sin(t*Math.PI*2)*1.3,0,0]})],
  Mount:[.86,t=>seated(t,clamp(t*1.28,0,1))],
  Riding_Idle:[2.4,t=>seated(t)],
  Riding_Walk:[.8,t=>{
    const p=seated(t),w=Math.sin(2*Math.PI*t);
    p.chest=[2,0,2*w];p.hips=[5,0,-2*w];
    p.lthigh=[-62+5*w,0,-8];p.rthigh=[-62-5*w,0,8];return p;
  }],
  Riding_Takeoff:[.78,t=>({...flying(t),chest:[-20+10*t,0,0],hips:[12+5*t,0,0]})],
  Riding_Fly:[1,t=>flying(t)],
  Riding_Glide:[2.4,t=>flying(t,false)],
  Riding_Landing:[.54,t=>({...seated(t),chest:[-8+10*t,0,0],hips:[12-5*t,0,0]})],
  Riding_Attack:[.4,t=>({...flying(t,false),
    rarm:[-45-23*Math.sin(Math.PI*t),10,12],
    chest:[-10-9*Math.sin(Math.PI*t),0,0]})],
  Riding_Hurt:[.5,t=>({...seated(t),
    spine:[-8,0,15*Math.sin(Math.PI*t)],
    head:[0,0,-12*Math.sin(Math.PI*t)]})],
  Dismount:[.77,t=>seated(t,clamp((1-t)*1.28,0,1))]
});
export function addMissingRiderClips(scene,clips=[]){
  const byName=new Set(clips.map(c=>c.name.toLowerCase()));
  const bones=Object.fromEntries(Object.entries(BONES)
    .map(([alias,name])=>[alias,scene.getObjectByName(name)
      ??scene.getObjectByName(name.replace(/[:./]/g,'_'))]).filter(([,bone])=>bone?.isBone));
  // Models with other skeletons retain their authored animation/fallback.
  if(!bones.hips||!bones.lthigh||!bones.rthigh||!bones.larm||!bones.rarm)return clips;
  const generated=[];
  for(const [name,[duration,pose]] of Object.entries(RIDER_CLIPS)){
    if(byName.has(name.toLowerCase()))continue;
    const frames=17,times=Array.from({length:frames},(_,i)=>duration*i/(frames-1));
    const tracks=[];
    for(const [alias,bone] of Object.entries(bones)){
      const original=bone.quaternion.clone(),q=new THREE.Quaternion();
      const values=[];
      for(let i=0;i<frames;i++){
        const degrees=pose(i/(frames-1))[alias]??[0,0,0];
        const euler=new THREE.Euler(...degrees.map(v=>THREE.MathUtils.degToRad(v)),'XYZ');
        q.setFromEuler(euler).premultiply(original).normalize();
        values.push(q.x,q.y,q.z,q.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(bone.name+'.quaternion',times,values));
    }
    generated.push(new THREE.AnimationClip(name,duration,tracks));
  }
  return [...clips,...generated];
}
export function mountedMotionState(dragon={}){
  if((dragon.hurtTime??0)>0)return 'rideHurt';
  if((dragon.attackTime??0)>0)return 'rideAttack';
  if(dragon.pose==='takeoff')return 'rideTakeoff';
  if(dragon.pose==='landing')return 'rideLand';
  if(dragon.airborne)return dragon.speed>12?'rideFly':'rideGlide';
  return dragon.speed>1.15?'rideWalk':'rideIdle';
}
