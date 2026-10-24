import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyDragonPreviewMotion,PREVIEW_MOTIONS} from '../src/entities/dragonPreviewMotion.js';
import {dragonAnimationState} from '../src/entities/dragonClipMap.js';

const states=['Idle','Walk','Fly','Glide','Attack','Hurt','Takeoff','Landing'];

function glbFixture(tag='good',names=states){
  const json=new TextEncoder().encode(JSON.stringify({
    tag,skins:[{joints:Array.from({length:49},(_,i)=>i)}],
    animations:names.map(name=>({name}))
  }));
  const bin=new Uint8Array(20+json.length);
  new DataView(bin.buffer).setUint32(12,json.length,true);
  bin.set(json,20);
  return bin.buffer;
}

/** Compile only the controller, replacing graphics and browser storage with
 * explicit mocks; production gameplay is independently tested in Chromium. */
function mockController(options={}){
  const moduleSource=readFileSync(new URL('../src/entities/SpeciesDragonModels.js',import.meta.url),'utf8')
    .replace(/^import .*;\s*$/gm,'')
    .replace(/\bexport\s+(?=const|class|function)/g,'')
    .replace(/import\.meta\.url/g,"'https://brumaria.example/src/entities/SpeciesDragonModels.js'");
  const saved=new Map(),loads=[],clears=[],fetches=[];
  const dragon={externalDragonModel:null};
  const load=options.load??(async(d,bytes)=>{
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes).subarray(20)));
    loads.push(json.tag);
    if(json.tag==='invalid-render')throw Error('O WebGL não conseguiu exibir o GLB.');
    d.externalDragonModel={tag:json.tag,source:'species'};
  });
  const clear=d=>{clears.push(d.externalDragonModel);d.externalDragonModel=null;};
  const ctor=new Function('installDragonGLB','clearDragonGLB','inspectGLB','loadSpeciesModel','saveSpeciesModel','fetch',
    moduleSource+'; return SpeciesDragonModels;')(
    load,clear,bytes=>{
      const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes).subarray(20)));
      return {animationCount:json.animations.length};
    },
    async id=>saved.get(id)??null,
    async(id,data)=>{saved.set(id,data);},
    async url=>{
      fetches.push(String(url));
      return {ok:true,json:async()=>({available:false,species:[]})};
    });
  return {m:new ctor(dragon),saved,loads,clears,dragon,fetches};
}

test('modelo importado é gravado somente após confirmar renderização',async()=>{
  const x=mockController();
  x.m.lastSelected='furia_noite';
  const good=glbFixture('first-good');
  const result=await x.m.installUploaded('furia_noite',good);
  assert.equal(result.loaded,true);
  assert.equal(result.saved,true);
  assert.equal(x.saved.get('furia_noite'),good);
  const displayed=x.dragon.externalDragonModel;
  assert.equal(displayed.species,'furia_noite');
  const bad=glbFixture('invalid-render');
  await assert.rejects(()=>x.m.installUploaded('furia_noite',bad),/WebGL/);
  assert.equal(x.dragon.externalDragonModel,displayed,'a antiga malha visual deve permanecer');
  assert.equal(x.saved.get('furia_noite'),good,'o modelo inválido não pode entrar em IndexedDB');
  assert.equal(x.m.local.get('furia_noite'),good,'o cache em RAM também precisa ser revertido');
  assert.equal(x.clears.length,0,'não remover visual válido ao receber novo arquivo');
});

test('arquivo com animação faltando é rejeitado antes da gravação',async()=>{
  const x=mockController();
  x.m.lastSelected='furia_noite';
  await assert.rejects(
    ()=>x.m.installUploaded('furia_noite',glbFixture('bad-clips',states.slice(0,7))),
    /8 animações/
  );
  assert.equal(x.saved.size,0);
  assert.equal(x.loads.length,0);
});

test('troca de Fúria aguarda novo GLB sem esconder o modelo anterior antes da hora',async()=>{
  let finish;
  const waiting=new Promise(resolve=>{finish=resolve;});
  const x=mockController({load:async(d,bytes)=>{
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes).subarray(20)));
    if(json.tag==='new-species')await waiting;
    d.externalDragonModel={tag:json.tag,source:'species'};
  }});
  x.m.lastSelected='furia_noite';
  await x.m.installUploaded('furia_noite',glbFixture('night'));
  const prev=x.dragon.externalDragonModel;
  x.m.local.set('furia_luz',glbFixture('new-species'));
  const moving=x.m.select('furia_luz');
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(x.dragon.externalDragonModel,prev);
  finish();
  assert.equal(await moving,true);
  assert.equal(x.dragon.externalDragonModel.species,'furia_luz');
});

test('sem GLB da espécie, recupera modelo procedural e não altera desbloqueio',async()=>{
  const x=mockController();
  x.m.lastSelected='furia_noite';
  await x.m.installUploaded('furia_noite',glbFixture());
  assert.equal(x.dragon.externalDragonModel.species,'furia_noite');
  const displayed=await x.m.select('nimbo');
  assert.equal(displayed,false);
  assert.equal(x.dragon.externalDragonModel,null);
  assert.equal(x.clears.length,1);
});

test('oito estados da prévia correspondem às animações de gameplay',()=>{
  assert.equal(PREVIEW_MOTIONS.length,8);
  for(const {id} of PREVIEW_MOTIONS){
    const dragon={airborne:false,riding:false,speed:0,pose:'ground',attackTime:0,hurtTime:0};
    assert.equal(applyDragonPreviewMotion(dragon,id),true);
    assert.equal(dragonAnimationState(dragon),id==='land'?'land':id);
  }
  assert.equal(applyDragonPreviewMotion({},'unknown'),false);
});
