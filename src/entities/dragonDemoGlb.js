/** Small original animated dragon exported as glTF 2.0 binary in memory.
 * No copyrighted character or downloaded files. Tests the real AnimationMixer
 * in browsers and illustrates node-based wing articulation (not skinned mesh). */
export function buildDragonDemoGLB(){
  const parts=[],views=[],accessors=[];
  let byteLength=0;
  function accessor(array,type,componentType,components,geometryTarget=null){
    const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);
    const aligned=Math.ceil(byteLength/4)*4;
    if(aligned>byteLength)parts.push(new Uint8Array(aligned-byteLength));
    const viewIndex=views.length;
    const view={buffer:0,byteOffset:aligned,byteLength:bytes.length};
    if(geometryTarget)view.target=geometryTarget;
    views.push(view);
    parts.push(new Uint8Array(bytes));byteLength=aligned+bytes.length;
    const entry={bufferView:viewIndex,componentType,count:array.length/components,type};
    accessors.push(entry);return accessors.length-1;
  }
  const cube=new Float32Array([
    -.5,-.5,-.5, .5,-.5,-.5, .5,.5,-.5,-.5,.5,-.5,
    -.5,-.5,.5, .5,-.5,.5, .5,.5,.5,-.5,.5,.5
  ]);
  const boxTris=new Uint16Array([
    0,1,2,0,2,3, 4,6,5,4,7,6,0,4,5,0,5,1,
    1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0
  ]);
  const wing=new Float32Array([
    0,0,0,1.2,.18,-.52,3.45,.03,-.72,
    2.35,-.14,.62,1.25,-.10,1.05
  ]);
  const wingTris=new Uint16Array([0,1,4,1,2,3,1,3,4]);
  const pBox=accessor(cube,'VEC3',5126,3,34962);
  const iBox=accessor(boxTris,'SCALAR',5123,1,34963);
  const pWing=accessor(wing,'VEC3',5126,3,34962);
  const iWing=accessor(wingTris,'SCALAR',5123,1,34963);
  accessors[pBox].min=[-.5,-.5,-.5];accessors[pBox].max=[.5,.5,.5];
  accessors[pWing].min=[0,-.14,-.72];accessors[pWing].max=[3.45,.18,1.05];
  const colors=[
    [.10,.48,.56,1],[.18,.72,.70,1],[.27,.77,.82,1],
    [.035,.14,.20,1],[.88,.92,.67,1]
  ];
  const materials=colors.map(c=>({pbrMetallicRoughness:{
    baseColorFactor:c,metallicFactor:0,roughnessFactor:.82},doubleSided:true}));
  const meshes=materials.map((_,m)=>({primitives:[{
    attributes:{POSITION:pBox},indices:iBox,material:m,mode:4
  }]}));
  const wingMesh=meshes.length;
  meshes.push({primitives:[{attributes:{POSITION:pWing},indices:iWing,material:1,mode:4}]});
  const nodes=[{name:'DemoDragonRoot',children:[]}];
  const add=(name,mesh,translation,scale,rotation)=>{
    const node={name,mesh,translation,scale};
    if(rotation)node.rotation=rotation;
    nodes[0].children.push(nodes.length);nodes.push(node);return nodes.length-1;
  };
  add('Corpo',0,[0,0,.20],[2.2,1.35,3.3]);
  const head=add('Cabeca',0,[0,.8,-1.48],[1.45,1.2,1.5]);
  add('Focinho',1,[0,.55,-2.2],[1.0,.48,1.2]);
  const left=add('AsaEsquerda',wingMesh,[-.75,.42,.05],[-1,1,1]);
  const right=add('AsaDireita',wingMesh,[.75,.42,.05],[1,1,1]);
  add('Cauda',0,[0,-.04,2.18],[.55,.42,2.5]);
  for(const side of [-1,1]){
    add(side<0?'OlhoEsquerdo':'OlhoDireito',3,[side*.58,1.03,-2.22],[.25,.22,.15]);
    add(side<0?'ChifreEsquerdo':'ChifreDireito',4,[side*.51,1.55,-1.4],[.2,.56,.25]);
    add(side<0?'PataDianteiraEsquerda':'PataDianteiraDireita',0,[side*.76,-.71,-.65],[.4,.75,.52]);
    add(side<0?'PataTraseiraEsquerda':'PataTraseiraDireita',0,[side*.78,-.69,1.04],[.48,.63,.56]);
  }
  const times=accessor(new Float32Array([0,.22,.44,.66]),'SCALAR',5126,1);
  accessors[times].min=[0];accessors[times].max=[.66];
  const animations=[];
  const angleQuat=a=>[0,0,Math.sin(a/2),Math.cos(a/2)];
  for(const [name,amplitude] of [
    ['Idle',.12],['Flying',.78],['Glide',.06],['Attack',.25],
    ['Takeoff',.65],['Landing',.12],['Walking',.18],['Hurt',.25]
  ]){
    const channels=[],samplers=[];
    for(const [side,node] of [[-1,left],[1,right]]){
      const angles=[0,amplitude,0,-amplitude].flatMap(a=>angleQuat(side*a));
      const output=accessor(new Float32Array(angles),'VEC4',5126,4);
      channels.push({sampler:samplers.length,target:{node,path:'rotation'}});
      samplers.push({input:times,output,interpolation:'LINEAR'});
    }
    animations.push({name,channels,samplers});
  }
  const binary=new Uint8Array(Math.ceil(byteLength/4)*4);
  let offset=0;
  for(const array of parts){binary.set(array,offset);offset+=array.byteLength;}
  const json={asset:{version:'2.0',generator:'Asas de Brumaria original Dragon GLB demo'},
    scene:0,scenes:[{nodes:[0]}],nodes,meshes,materials,
    buffers:[{byteLength:binary.byteLength}],bufferViews:views,accessors,animations};
  // A glTF geometry box/wing primitive is reused by node instancing.
  const bytes=new TextEncoder().encode(JSON.stringify(json));
  const pad=Math.ceil(bytes.length/4)*4;
  const result=new Uint8Array(12+8+pad+8+binary.byteLength);
  const d=new DataView(result.buffer);
  d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,result.length,true);
  d.setUint32(12,pad,true);d.setUint32(16,0x4e4f534a,true);
  result.fill(32,20,20+pad);result.set(bytes,20);
  const tail=20+pad;
  d.setUint32(tail,binary.byteLength,true);d.setUint32(tail+4,0x004e4942,true);
  result.set(binary,tail+8);
  return result;
}
