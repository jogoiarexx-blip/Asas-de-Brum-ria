import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  preferMobileDragonAssets,maxDragonTextureSize,downsizeDragonTextures
} from '../src/entities/dragonTextureBudget.js';

test('celulares escolhem variante móvel sem afetar desktop com GPU forte',()=>{
  assert.equal(preferMobileDragonAssets({memory:2}),true);
  assert.equal(preferMobileDragonAssets({memory:8,coarse:true}),true);
  assert.equal(preferMobileDragonAssets({memory:16,coarse:false}),false);
  assert.equal(preferMobileDragonAssets({memory:8,saveData:true}),true);
  assert.equal(maxDragonTextureSize({memory:2}),512);
  assert.equal(maxDragonTextureSize({memory:4}),1024);
  assert.equal(maxDragonTextureSize({memory:8,coarse:true}),1024);
  assert.equal(maxDragonTextureSize({memory:16}),Infinity);
});
test('texturas 2K são diminuídas sem alterar mapas, materiais ou ossos',()=>{
  const images=[];
  const canvasFactory=(w,h)=>{
    const canvas={width:w,height:h,getContext:()=>({
      imageSmoothingEnabled:false,imageSmoothingQuality:'low',
      drawImage:(...args)=>images.push(args)
    })};
    return canvas;
  };
  const tex={isTexture:true,image:{width:2048,height:2048},needsUpdate:false};
  const small={isTexture:true,image:{width:512,height:512}};
  const normal={isTexture:true,image:{width:2048,height:1024},needsUpdate:false};
  const material={map:tex,normalMap:normal,roughnessMap:tex,aoMap:small};
  const skinned={isMesh:true,isSkinnedMesh:true,material,skeleton:{boneCount:49}};
  const scene={traverse(fn){fn(skinned);}};
  const result=downsizeDragonTextures(scene,1024,{canvasFactory});
  assert.deepEqual(result,{resized:2,skipped:1});
  assert.equal(tex.image.width,1024);
  assert.equal(normal.image.width,1024);
  assert.equal(normal.image.height,512);
  assert.equal(small.image.width,512);
  assert.equal(tex.needsUpdate,true);
  assert.equal(normal.needsUpdate,true);
  assert.equal(skinned.skeleton.boneCount,49);
  assert.equal(images.length,2);
  assert.equal(material.roughnessMap,tex,'textura compartilhada deve manter sua identidade');
});
test('sem Canvas 2D ou falha de contexto mantém a textura 2K original',()=>{
  const tex={isTexture:true,image:{width:2048,height:2048}};
  const root={traverse:fn=>fn({isMesh:true,material:{map:tex}})};
  assert.deepEqual(downsizeDragonTextures(root,1024,{canvasFactory:()=>null}),{resized:0,skipped:1});
  assert.equal(tex.image.width,2048);
  assert.equal(downsizeDragonTextures(root,Infinity).resized,0);
});
test('o catálogo de GLBs contém variante 1K sem mudar a seleção de espécies',async()=>{
  const source=readFileSync(new URL('../src/entities/SpeciesDragonModels.js',import.meta.url),'utf8')
    .replace(/^import .*;\s*$/gm,'')
    .replace(/\bexport\s+(?=const|class|function)/g,'')
    .replace(/import\.meta\.url/g,"'https://brumaria.example/src/entities/SpeciesDragonModels.js'");
  const fakeFetch=async url=>{
    const name=String(url);
    if(name.endsWith('dragon-species.json'))
      return {ok:true,json:async()=>({available:true,mobile:true,species:['furia_noite','furia_luz']})};
    fetches.push(name);
    if(name.endsWith('-mobile.glb')&&rejectMobile)return {ok:false,status:404};
    return {ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
  };
  let rejectMobile=false;const fetches=[];
  const Model=new Function('installDragonGLB','clearDragonGLB','inspectGLB','loadSpeciesModel','saveSpeciesModel','fetch',
    source+';return SpeciesDragonModels;')(
    ()=>{},()=>{},()=>{},async()=>null,async()=>{},fakeFetch);
  const model=new Model({}, {fetcher:fakeFetch,preferMobile:true});
  await model.read('furia_noite');
  assert.ok(fetches[0].endsWith('furia-da-noite-mobile.glb'));
  rejectMobile=true;
  const fallback=new Model({}, {fetcher:fakeFetch,preferMobile:true});
  await fallback.read('furia_luz');
  assert.ok(fetches.at(-2).endsWith('furia-da-luz-mobile.glb'));
  assert.ok(fetches.at(-1).endsWith('furia-da-luz.glb'));
  const desktop=new Model({}, {fetcher:fakeFetch,preferMobile:false});
  await desktop.read('furia_noite');
  assert.ok(fetches.at(-1).endsWith('furia-da-noite.glb'));
});
