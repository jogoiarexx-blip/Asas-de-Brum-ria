/** Original, tiny glTF 2.0 binary created in memory to test the real GLTFLoader.
 * This is intentionally a low-poly test figure, not a replacement for a rigged asset.
 */
export function buildDemoGLB(){
 const coords=[-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5];
 const indices=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
 const vertexBytes=coords.length*4,indexBytes=indices.length*2;
 const binary=new Uint8Array(vertexBytes+indexBytes),v=new DataView(binary.buffer);
 coords.forEach((n,i)=>v.setFloat32(i*4,n,true));
 indices.forEach((n,i)=>v.setUint16(vertexBytes+i*2,n,true));
 const colors=[[.12,.48,.5,1],[.89,.67,.47,1],[.30,.23,.17,1],[.18,.23,.31,1],[.58,.22,.29,1]];
 const materials=colors.map(color=>({pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:0,roughnessFactor:.92},doubleSided:false}));
 const mesh=(m)=>({primitives:[{attributes:{POSITION:0},indices:1,material:m} ]});
 const parts=[
   ['Tronco',0,[0,1.18,0],[.66,.82,.42]],['Cabeca',1,[0,1.88,-.02],[.50,.48,.52]],
   ['Chapeu',2,[0,2.18,0],[.58,.13,.59]],['Braco_E',0,[-.46,1.22,0],[.20,.66,.25]],
   ['Braco_D',0,[.46,1.22,0],[.20,.66,.25]],['Perna_E',3,[-.20,.42,0],[.25,.82,.30]],
   ['Perna_D',3,[.20,.42,0],[.25,.82,.30]],['Capa',4,[0,1.2,.3],[.8,1.04,.10]]
 ];
 const json={asset:{version:'2.0',generator:'Asas de Brumaria original demo'},
   scene:0,scenes:[{nodes:parts.map((_,i)=>i)}],
   nodes:parts.map(([name,material,translation,scale],i)=>({name,mesh:material,translation,scale})),
   meshes:materials.map((_,i)=>mesh(i)),materials,
   buffers:[{byteLength:binary.length}],bufferViews:[{buffer:0,byteOffset:0,byteLength:vertexBytes,target:34962},{buffer:0,byteOffset:vertexBytes,byteLength:indexBytes,target:34963}],
   accessors:[{bufferView:0,componentType:5126,count:8,type:'VEC3',min:[-.5,-.5,-.5],max:[.5,.5,.5]},{bufferView:1,componentType:5123,count:36,type:'SCALAR',min:[0],max:[7]}]};
 const encode=new TextEncoder().encode(JSON.stringify(json));
 const jsonSize=Math.ceil(encode.length/4)*4,binSize=Math.ceil(binary.length/4)*4;
 const bytes=new Uint8Array(12+8+jsonSize+8+binSize);const out=new DataView(bytes.buffer);
 out.setUint32(0,0x46546c67,true);out.setUint32(4,2,true);out.setUint32(8,bytes.length,true);
 out.setUint32(12,jsonSize,true);out.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jsonSize);bytes.set(encode,20);
 let off=20+jsonSize;out.setUint32(off,binSize,true);out.setUint32(off+4,0x004e4942,true);bytes.set(binary,off+8);
 return bytes;
}
