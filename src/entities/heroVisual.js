import * as THREE from 'three';

const material=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});
/** Procedural fallback hero. Keep rig hierarchy small so external GLB replacement
 * can reuse one Hero controller without changing collision/mission logic. */
export function buildHero(){
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const leather=material(0x64432a),coat=material(0x346c64),coatLight=material(0x50867c),skin=material(0xe1ae84),
   hair=material(0x362725),metal=material(0xe3cb96,.42),dark=material(0x253a38),capeMat=material(0x933c40);
 const add=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
   const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
   m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 add(body,new THREE.CylinderGeometry(.32,.43,.83,10),coat,0,1.13,0);
 add(body,new THREE.CylinderGeometry(.44,.44,.12,10),leather,0,.76,0);
 add(body,new THREE.BoxGeometry(.33,.17,.14),metal,0,.78,-.4);
 // Diagonal saddle-rider leather strap across the tunic.
 const strap=add(body,new THREE.BoxGeometry(.13,.94,.1),leather,-.1,1.2,-.39);strap.rotation.z=-.36;
 add(body,new THREE.BoxGeometry(.32,.15,.12),coatLight,0,1.56,-.29);
 // Head and protective leather cap, with visible eyes and readable facial features.
 add(body,new THREE.SphereGeometry(.32,14,12),skin,0,1.92,-.025);
 add(body,new THREE.SphereGeometry(.33,12,8),hair,0,2.085,.025,1,.57,1);
 const brim=add(body,new THREE.BoxGeometry(.68,.065,.35),leather,0,2.09,-.19);
 brim.rotation.x=.06;
 for(const side of [-1,1]){
   add(body,new THREE.SphereGeometry(.045,8,6),dark,side*.125,1.947,-.318);
   add(body,new THREE.SphereGeometry(.016,6,5),metal,side*.113,1.965,-.352);
   const brow=add(body,new THREE.BoxGeometry(.115,.026,.042),hair,side*.126,2.035,-.312);brow.rotation.z=side*.11;
 }
 add(body,new THREE.BoxGeometry(.16,.025,.018),leather,0,1.827,-.326);
 const legs=[],arms=[];
 for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.225,.68,0);body.add(leg);
   add(leg,new THREE.CylinderGeometry(.18,.18,.38,9),dark,0,-.18,0);
   const knee=new THREE.Group();knee.position.y=-.39;leg.add(knee);
   add(knee,new THREE.CylinderGeometry(.168,.17,.38,9),leather,0,-.16,0);
   add(knee,new THREE.BoxGeometry(.37,.16,.44),leather,0,-.37,-.09);
   legs.push({hip:leg,knee});
   const arm=new THREE.Group();arm.position.set(side*.43,1.47,0);body.add(arm);
   add(arm,new THREE.CylinderGeometry(.17,.15,.4,10),coat,side*.055,-.19,0);
   const elbow=new THREE.Group();elbow.position.set(side*.06,-.4,0);arm.add(elbow);
   add(elbow,new THREE.CylinderGeometry(.145,.13,.37,9),coatLight,0,-.17,0);
   add(elbow,new THREE.SphereGeometry(.15,10,8),leather,0,-.41,-.02);
   add(arm,new THREE.SphereGeometry(.22,9,7),coatLight,side*.065,-.02,0);
   arms.push({shoulder:arm,elbow});
 }
 const cape=new THREE.Group();cape.position.set(0,1.51,.30);body.add(cape);
 const capeMesh=add(cape,new THREE.ConeGeometry(.73,1.34,5),capeMat,0,-.6,.2,1,1,.20);capeMesh.rotation.x=.12;
 add(cape,new THREE.BoxGeometry(.66,.12,.11),metal,0,-.07,-.08);
 g.userData={legs,arms,cape,body};
 return g;
}
