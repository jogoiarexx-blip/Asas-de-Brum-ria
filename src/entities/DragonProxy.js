import * as THREE from 'three';
/** Low triangle silhouette for distant wild/enemy dragons.
 * Geometries and materials are shared between creatures to avoid GPU duplication.
 * In contrast to the close-up model, this mesh has no joints, extra eyes, lights,
 * cast shadows, and needs no per-frame animation. It never participates in gameplay.
 */
const geometries={
 body:new THREE.SphereGeometry(1,8,5),
 head:new THREE.SphereGeometry(1,6,4),
 tail:new THREE.ConeGeometry(1,1,4),
 wing:(()=>{
   const g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, 3,0,-.95, 2.1,0,1.35],3));
   g.computeVertexNormals();return g;
 })()
};
const materialCache=new Map();
function material(color){
 const key=Number(color)>>>0;
 if(!materialCache.has(key))materialCache.set(key,new THREE.MeshLambertMaterial({color:key,side:THREE.DoubleSide,flatShading:true}));
 return materialCache.get(key);
}
function mesh(parent,geometry,mat,x,y,z,sx,sy,sz){
 const m=new THREE.Mesh(geometry,mat);
 m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=false;m.receiveShadow=false;
 parent.add(m);return m;
}
/** Use the exact same root coordinates as the detailed creature. */
export function buildDragonProxy(bodyColor,wingColor,{enemy=false}={}){
 const group=new THREE.Group();group.name='DragonProxy_LOD';
 const body=material(bodyColor),wings=material(wingColor);
 const y=enemy?0:1.9;
 mesh(group,geometries.body,body,0,y,.2,1.23,.73,enemy?2.15:1.55);
 mesh(group,geometries.head,body,0,y+.37,enemy?-2.35:-1.47,.69,.55,.9);
 for(const side of [-1,1]){
   // Mirroring the wing scale does not require a second BufferGeometry.
   mesh(group,geometries.wing,wings,side*.75,y+.48,0,side,1,1);
 }
 const tail=mesh(group,geometries.tail,body,0,y-.2,enemy?2.65:2.35,.38,2.3,.38);
 tail.rotation.x=Math.PI/2;
 return group;
}
