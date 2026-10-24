import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {inspectGLB} from '../src/entities/glbValidation.js';

const base=new URL('../assets/models/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('dragon-species.json',base),'utf8'));
const expected=[['furia_noite','furia-da-noite.glb'],['furia_luz','furia-da-luz.glb']];
if(!manifest.available){
  // Allows the code-only PR to pass without promising that the large GLBs
  // were uploaded. Publishing assets requires manifest=true and both files.
  console.log('GLB da Fúria da Noite/Luz: ainda não publicados; fallback procedural ativo.');
}else{
  for(const [species,name] of expected){
    assert.ok(manifest.species.includes(species),`Manifesto não habilitou ${species}`);
    const url=new URL(name,base);
    assert.ok(existsSync(url),`Falta o arquivo ${name}`);
    const bin=readFileSync(url),report=inspectGLB(bin);
    const len=new DataView(bin.buffer,bin.byteOffset,bin.byteLength).getUint32(12,true);
    const json=JSON.parse(new TextDecoder().decode(bin.subarray(20,20+len)));
    assert.ok(json.skins?.length,'Rig ausente');
    assert.equal(json.skins[0].joints.length,49);
    assert.equal(report.animationCount,8);
    const clips=new Set(json.animations.map(x=>x.name));
    for(const name of ['Idle','Walk','Fly','Glide','Attack','Hurt','Takeoff','Landing'])
      assert.ok(clips.has(name),`O clip ${name} está ausente de ${species}`);
    if(manifest.mobile===true){
      const mobileName=name.replace(/\.glb$/,'-mobile.glb');
      const mobileUrl=new URL(mobileName,base);
      assert.ok(existsSync(mobileUrl),`Falta a versão para celular ${mobileName}`);
      const light=readFileSync(mobileUrl),lightInfo=inspectGLB(light);
      const lenLight=new DataView(light.buffer,light.byteOffset,light.byteLength).getUint32(12,true);
      const lightJson=JSON.parse(new TextDecoder().decode(light.subarray(20,20+lenLight)));
      assert.equal(lightInfo.animationCount,8);
      assert.equal(lightJson.skins[0].joints.length,49);
      assert.deepEqual(lightJson.meshes,json.meshes,`O GLB mobile mudou a geometria de ${species}`);
      assert.deepEqual(lightJson.animations,json.animations,`O GLB mobile mudou animações de ${species}`);
      assert.ok(light.length<bin.length,`O GLB mobile não ficou menor: ${mobileName}`);
      for(const key of Object.keys(json.asset?.extras??{})){
        if(key!=='brumariaMobile')assert.deepEqual(lightJson.asset?.extras?.[key],json.asset?.extras?.[key]);
      }
      console.log(`GLB MOBILE VALIDADO: ${mobileName} · ${(light.length/1024/1024).toFixed(2)} MB · mesma geometria/rig/clipes`);
    }
    console.log(`GLB VALIDADO: ${species} · ${(bin.length/1024/1024).toFixed(2)} MB · 49 ossos · 8 animações`);
  }
}
