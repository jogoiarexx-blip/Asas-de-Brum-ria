import * as THREE from 'three';
import {hatchlingPose} from './CreatureMotion.js';

// Three rescue hatchlings share their geometry. Only palette and transforms differ.
const bodyGeo=new THREE.SphereGeometry(1,14,10);
const eyeGeo=new THREE.SphereGeometry(1,12,10);
const pawGeo=new THREE.SphereGeometry(1,9,7);
const hornGeo=new THREE.ConeGeometry(1,1,5);
const wingGeo=(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0,  .85,.09,-.48,  2.15,.03,-.64,
    1.94,-.04,.19,  1.54,-.07,.88,  .62,-.03,.76
  ],3));
  g.setIndex([0,1,5,1,2,3,1,3,4,1,4,5]);
  g.computeVertexNormals();
  return g;
})();
const pupilMat=new THREE.MeshBasicMaterial({color:0x15394b});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf4ffff,roughness:.26});
const sparkleMat=new THREE.MeshBasicMaterial({color:0xffffff});
const colors=[
  {body:0x69bb91,belly:0xc0eed3,wing:0x58a88d,detail:0x3a8b77,iris:0x61b6be},
  {body:0x8daae6,belly:0xe0e9fb,wing:0x7b94db,detail:0x5768b3,iris:0x4d91dd},
  {body:0xd4b976,belly:0xf5dfad,wing:0xbd995e,detail:0x927a53,iris:0x91a873}
];
function add(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;
  parent.add(mesh);return mesh;
}

/** Keeps the same rescue target root and markers used by Missions. */
export function buildHatchling(index){
  const c=colors[((index%colors.length)+colors.length)%colors.length];
  const mats={
    body:new THREE.MeshStandardMaterial({color:c.body,roughness:.76}),
    belly:new THREE.MeshStandardMaterial({color:c.belly,roughness:.83}),
    wing:new THREE.MeshStandardMaterial({color:c.wing,roughness:.69,side:THREE.DoubleSide,flatShading:true}),
    detail:new THREE.MeshStandardMaterial({color:c.detail,roughness:.62}),
    iris:new THREE.MeshBasicMaterial({color:c.iris})
  };
  const group=new THREE.Group(),root=new THREE.Group();group.add(root);
  const body=add(root,bodyGeo,mats.body,0,.06,.17,.94,.75,1.28);
  add(root,bodyGeo,mats.belly,0,-.19,-.34,.74,.48,.90);
  // Juvenile proportions: broad skull, round cheeks, short legs and soft horns.
  const head=new THREE.Group();head.position.set(0,.65,-.94);root.add(head);
  add(head,bodyGeo,mats.body,0,.02,0,.91,.79,.82);
  add(head,bodyGeo,mats.belly,0,-.24,-.57,.66,.30,.48);
  for(const side of [-1,1]){
    add(head,pawGeo,mats.body,side*.60,-.20,-.46,.31,.25,.29);
    const eye=new THREE.Group();eye.position.set(side*.54,.13,-.54);head.add(eye);
    add(eye,eyeGeo,mats.detail,0,0,0,.255,.29,.135);
    add(eye,eyeGeo,whiteMat,0,0,-.035,.221,.245,.135);
    add(eye,eyeGeo,mats.iris,0,-.012,-.151,.158,.18,.067);
    add(eye,eyeGeo,pupilMat,0,-.018,-.206,.090,.128,.047);
    add(eye,eyeGeo,sparkleMat,-side*.047,.070,-.238,.040,.044,.025);
    (group.userData.eyes??=[]).push(eye);
    const horn=add(head,hornGeo,mats.detail,side*.54,.72,.23,.15,.32,.17);
    horn.rotation.z=-side*.45;horn.rotation.x=-.20;
    // Four separate paws, not adult-length straight columns.
    for(const z of [-.69,.86]){
      add(root,pawGeo,mats.body,side*.65,-.50,z,.29,.30,.38);
      add(root,pawGeo,mats.detail,side*.65,-.73,z-.13,.29,.12,.31);
    }
  }
  for(const side of [-1,1]){
    const joint=new THREE.Group();joint.position.set(side*.77,.27,.15);root.add(joint);
    const membrane=new THREE.Mesh(wingGeo,mats.wing);membrane.scale.x=side;membrane.castShadow=true;joint.add(membrane);
    add(joint,hornGeo,mats.detail,side*1.25,.09,-.25,.10,.23,.11).rotation.z=-side*1.25;
    (group.userData.wings??=[]).push({w:joint,side});
  }
  const tail=new THREE.Group();tail.position.set(0,.02,1.22);root.add(tail);
  const tailSegment=add(tail,bodyGeo,mats.body,0,.05,.44,.27,.27,.80);
  tailSegment.rotation.x=-.18;
  const fin=add(tail,bodyGeo,mats.wing,0,.10,1.08,.34,.16,.43);
  fin.rotation.x=.25;
  for(let i=0;i<4;i++){
    const crest=add(root,hornGeo,mats.detail,0,.80-i*.06,-.58+i*.54,.16,.34-i*.035,.16);
    crest.rotation.x=-.30;
  }
  const glow=new THREE.MeshBasicMaterial({color:0xa5ffd0,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.16,5,28),glow);
  ring.rotation.x=.2;group.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.8,15,7,1,true),new THREE.MeshBasicMaterial({color:0x83ffc7,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}));
  beam.position.y=7.5;group.add(beam);
  group.userData.ring=ring;
  group.userData.babyRig={root,body,head,tail,eyes:group.userData.eyes};
  return group;
}

export function animateHatchling(baby,time,dt,index,carried=false){
  const rig=baby.userData.babyRig;
  if(!rig)return;
  const pose=hatchlingPose(time,index,carried);
  const ease=(value,target,speed=9)=>THREE.MathUtils.damp(value,target,speed,Math.max(0,dt));
  rig.body.scale.y=ease(rig.body.scale.y,.75*pose.breath,5);
  rig.head.rotation.x=ease(rig.head.rotation.x,pose.headPitch);
  rig.head.rotation.z=ease(rig.head.rotation.z,pose.headRoll,5);
  rig.tail.rotation.y=ease(rig.tail.rotation.y,pose.tailYaw,6);
  for(const eye of rig.eyes)eye.scale.y=ease(eye.scale.y,pose.eyeOpen,11);
  for(const {w,side} of baby.userData.wings){
    w.rotation.z=ease(w.rotation.z,side*(.14+pose.wingFlap),8);
    w.rotation.x=ease(w.rotation.x,side*.09,6);
  }
}
