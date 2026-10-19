import * as THREE from 'three';

/**
 * Collapse opaque static meshes by material INSIDE a single rig pivot.
 * Only direct children are eligible: animated joints and their transforms
 * remain separate. Call once while constructing the model, never per frame.
 *
 * All primitive attributes are retained (including UVs, normals, vertex color).
 * Source geometries are intentionally not disposed; some are shared by meshes.
 */
export function batchRigidMeshes(pivot,{preserve=[]}={}){
  const protectedMeshes=new Set(preserve);
  const batches=new Map();
  const allowable=['position','normal','uv','color'];
  for(const mesh of pivot.children){
    if(!mesh.isMesh||protectedMeshes.has(mesh)||!mesh.geometry?.isBufferGeometry)continue;
    const mat=mesh.material,geo=mesh.geometry;
    if(!mat||Array.isArray(mat)||mat.transparent||geo.morphAttributes?.position?.length)continue;
    if(geo.groups?.length>1||geo.drawRange.start!==0||geo.drawRange.count!==Infinity)continue;
    const names=Object.keys(geo.attributes);
    if(names.some(n=>!allowable.includes(n)))continue;
    if(!geo.getAttribute('position')||!geo.getAttribute('normal'))continue;
    if(names.some(n=>geo.getAttribute(n).isInterleavedBufferAttribute))continue;
    const attrs=names.sort().map(n=>n+':'+geo.getAttribute(n).itemSize).join('|');
    const key=[mat.uuid,attrs,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder].join('|');
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(mesh);
  }
  let removed=0,combined=0;
  for(const items of batches.values()){
    if(items.length<2)continue;
    const baked=[];
    const names=Object.keys(items[0].geometry.attributes);
    for(const mesh of items){
      mesh.updateMatrix();
      const copy=mesh.geometry.clone();
      const expanded=copy.index?copy.toNonIndexed():copy;
      expanded.applyMatrix4(mesh.matrix);
      baked.push(expanded);
      if(expanded!==copy)copy.dispose();
    }
    const merged=new THREE.BufferGeometry();
    for(const name of names){
      const attr=baked[0].getAttribute(name),size=attr.itemSize;
      const total=baked.reduce((sum,g)=>sum+g.getAttribute(name).count,0);
      const packed=new Float32Array(total*size);
      let at=0;
      for(const geo of baked){
        const source=geo.getAttribute(name);
        for(let i=0;i<source.count;i++){
          for(let c=0;c<size;c++)packed[at++]=source.getComponent(i,c);
        }
      }
      merged.setAttribute(name,new THREE.Float32BufferAttribute(packed,size));
    }
    merged.computeBoundingSphere();
    const mesh=new THREE.Mesh(merged,items[0].material);
    mesh.name='BatchedRigidParts';
    mesh.castShadow=items[0].castShadow;
    mesh.receiveShadow=items[0].receiveShadow;
    mesh.renderOrder=items[0].renderOrder;
    for(const old of items)pivot.remove(old);
    pivot.add(mesh);
    baked.forEach(g=>g.dispose());
    removed+=items.length-1;combined++;
  }
  return {removed,combined};
}
