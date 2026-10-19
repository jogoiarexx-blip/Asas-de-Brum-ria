/**
 * Optional OFFLINE asset gate for legal, self-contained GLB models.
 *
 * Works with Node 22 alone for inspection. Optimization requires the
 * independently installed MIT-licensed @gltf-transform/cli program.
 * No package is downloaded or loaded by the published browser game.
 */
import {readFile,rename,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {inspectGLB} from '../src/entities/glbValidation.js';

const execFileAsync=promisify(execFile);
const decoder=new TextDecoder('utf-8',{fatal:true});
export function modelReportGLB(bytes){
  const basic=inspectGLB(bytes);
  const bin=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  const jsonLength=new DataView(bin.buffer,bin.byteOffset,bin.byteLength).getUint32(12,true);
  const gltf=JSON.parse(decoder.decode(bin.subarray(20,20+jsonLength)));
  let triangles=0,vertices=0,primitives=0;
  for(const mesh of gltf.meshes??[])for(const primitive of mesh.primitives??[]){
    const mode=primitive.mode??4;
    primitives++;
    const count=gltf.accessors?.[primitive.indices??-1]?.count
      ??gltf.accessors?.[primitive.attributes?.POSITION??-1]?.count??0;
    vertices+=gltf.accessors?.[primitive.attributes?.POSITION??-1]?.count??0;
    // Triangle lists; avoid misreporting lines and triangle strips as triangles.
    if(mode===4)triangles+=Math.floor(count/3);
    else if(mode===5||mode===6)triangles+=Math.max(0,count-2);
  }
  const jointCount=(gltf.skins??[]).reduce((n,skin)=>n+(skin.joints?.length??0),0);
  const animationChannels=(gltf.animations??[]).reduce((n,a)=>n+(a.channels?.length??0),0);
  const warnings=[];
  if(!basic.animationCount)warnings.push('Sem animações GLB; requer rig/poses extras para personagens.');
  if(primitives>40)warnings.push('Muitas submalhas: podem gerar muitas chamadas de desenho.');
  if(triangles>50000)warnings.push('Alto número de triângulos para NPCs repetidos e dispositivos móveis.');
  if((gltf.textures?.length??0)>12)warnings.push('Muitas texturas; considere atlas e redução a 1024 px.');
  return {...basic,primitives,triangles,vertices,skins:gltf.skins?.length??0,
    joints:jointCount,animationChannels,materials:gltf.materials?.length??0,
    textures:gltf.textures?.length??0,images:gltf.images?.length??0,
    warnings};
}

export function validateOptimized(original,optimized){
  const before=modelReportGLB(original),after=modelReportGLB(optimized);
  if(after.animationCount<before.animationCount)throw Error('Otimização perdeu animações GLB.');
  if(after.skins<before.skins||after.joints<before.joints)throw Error('Otimização perdeu partes do esqueleto.');
  if(after.meshCount===0||after.primitives===0)throw Error('Otimização perdeu as malhas 3D.');
  return {before,after,bytesSaved:before.byteLength-after.byteLength,
    savingPercent:Math.round((1-after.byteLength/before.byteLength)*1000)/10};
}

async function main(){
  const [command,input,output]=process.argv.slice(2);
  if(!['inspect','optimize'].includes(command)||!input||command==='optimize'&&!output){
    throw Error('Uso: npm run assets:inspect -- modelo.glb | npm run assets:optimize -- entrada.glb saida.glb');
  }
  const source=resolve(input);
  if(extname(source).toLowerCase()!=='.glb')throw Error('Use um modelo .glb autocontido.');
  const original=await readFile(source);
  if(command==='inspect'){
    process.stdout.write(JSON.stringify(modelReportGLB(original),null,2)+'\n');return;
  }
  const target=resolve(output);
  if(target===source||extname(target).toLowerCase()!=='.glb')
    throw Error('Use um caminho .glb de saída diferente do original.');
  const temp=target.replace(/\.glb$/i,'.brumaria-temp.glb');
  try{
    // GLTFLoader r180 currently has no Draco/Meshopt/KTX2 decoder registered
    // in the hero's importer. Avoid these extensions entirely.
    // Preserve articulated model hierarchy and animation clips.
    await execFileAsync('gltf-transform',[
      'optimize',source,temp,'--compress','false',
      '--flatten','false','--join','false','--instance','false',
      '--simplify','false','--weld','false','--resample','false',
      '--palette','false','--texture-compress','webp','--texture-size','1024'
    ],{maxBuffer:8*1024*1024});
    const optimized=await readFile(temp);
    const report=validateOptimized(original,optimized);
    await rename(temp,target);
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }catch(error){
    await unlink(temp).catch(()=>{});
    if(error.code==='ENOENT')throw Error('Instale a ferramenta open source: npm install -g @gltf-transform/cli. Nenhuma dependência é adicionada ao jogo.');
    throw error;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{console.error('Falha no pipeline de modelos:',e.message);process.exitCode=1;});
}
