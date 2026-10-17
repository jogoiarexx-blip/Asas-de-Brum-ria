/** Minimal structural validation before allocating graphics resources for user GLBs. */
export const MAX_GLB_SIZE = 48 * 1024 * 1024;
const decoder = new TextDecoder('utf-8',{fatal:true});
const unsupported = new Set(['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu','EXT_texture_avif']);
export function unsupportedGLBExtensions(json={}){
  return (json.extensionsRequired??[]).filter(name=>unsupported.has(name));
}
export function inspectGLB(source){
  const bytes=source instanceof Uint8Array?source: new Uint8Array(source);
  if(bytes.byteLength<20)throw new Error('Arquivo GLB muito pequeno ou incompleto.');
  if(bytes.byteLength>MAX_GLB_SIZE)throw new Error('GLB maior que 48 MB. Reduza polígonos e texturas para computadores fracos.');
  const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(d.getUint32(0,true)!==0x46546c67)throw new Error('Assinatura GLB inválida. Exporte em glTF Binary (.glb).');
  const version=d.getUint32(4,true);
  if(version!==2)throw new Error('Versão GLB não suportada. Use glTF 2.0.');
  if(d.getUint32(8,true)!==bytes.byteLength)throw new Error('Tamanho GLB incorreto ou arquivo incompleto.');
  const jsonSize=d.getUint32(12,true);
  if(d.getUint32(16,true)!==0x4e4f534a||jsonSize<2||jsonSize+20>bytes.length)throw new Error('Chunk JSON do GLB ausente ou incompleto.');
  let json;
  try{json=JSON.parse(decoder.decode(bytes.subarray(20,20+jsonSize)));}
  catch{throw new Error('JSON interno do GLB inválido.');}
  if(json.asset?.version!=='2.0')throw new Error('O arquivo precisa usar glTF 2.0.');
  const missing=unsupportedGLBExtensions(json);
  if(missing.length)throw new Error('GLB exige compressão/extensão não instalada: '+missing.join(', ')+'. Exporte sem Draco/Meshopt/KTX2.');
  if(!json.meshes?.length)throw new Error('O GLB não possui malhas 3D para exibir.');
  return {version,assetVersion:json.asset.version,byteLength:bytes.byteLength,meshCount:json.meshes.length,nodeCount:json.nodes?.length??0,animationCount:json.animations?.length??0};
}
