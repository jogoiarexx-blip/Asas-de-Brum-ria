import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceSnapshot,shouldSkipRendering} from '../src/systems/PerformanceDiagnostics.js';
import {saveHeroGLB} from '../src/entities/heroAssetStore.js';

test('aba oculta e GPU perdida interrompem trabalho gráfico sem modificar o estado salvo',()=>{
 assert.equal(shouldSkipRendering({hidden:true}),true);
 assert.equal(shouldSkipRendering({webglLost:true}),true);
 assert.equal(shouldSkipRendering({hidden:false,webglLost:false}),false);
});

test('diagnóstico produz dados numéricos úteis inclusive com GPU indisponível',()=>{
 const report=performanceSnapshot({fps:27,renderer:{info:{render:{calls:124,triangles:53020},memory:{geometries:92,textures:18}}},projectiles:9,effects:24,tier:'economy',mounted:true});
 for(const phrase of ['27','124','53.020','92','18','9','24','ECONOMY','montado'])assert.ok(report.includes(phrase),phrase);
 const noGPU=performanceSnapshot();assert.match(noGPU,/—/);
});

test('IndexedDB não confirma salvamento quando request venceu mas transação falhou', async()=>{
 const original=globalThis.indexedDB;
 let transaction;
 globalThis.indexedDB={open(){const request={result:{objectStoreNames:{contains:()=>true},close(){},transaction(){return transaction;}}};queueMicrotask(()=>request.onsuccess());return request;}};
 transaction={objectStore(){return {put(){const req={result:'ok'};queueMicrotask(()=>req.onsuccess());queueMicrotask(()=>transaction.onabort());return req;}};}};
 try{await assert.rejects(saveHeroGLB({name:'demo.glb',size:48}),/cancelado/);}finally{globalThis.indexedDB=original;}
});

test('IndexedDB confirma gravação somente depois do commit',async()=>{
 const original=globalThis.indexedDB;
 let transaction,complete;
 globalThis.indexedDB={open(){const request={result:{objectStoreNames:{contains:()=>true},close(){},transaction(){return transaction;}}};queueMicrotask(()=>request.onsuccess());return request;}};
 transaction={objectStore(){return {put(){const req={result:'ok'};queueMicrotask(()=>req.onsuccess());return req;}};}};
 try{
   let resolved=false;
   const pending=saveHeroGLB({name:'demo.glb',size:48}).then(()=>{resolved=true;});
   await new Promise(resolve=>setImmediate(resolve));
   assert.equal(resolved,false,'não pode confirmar gravado antes do commit');
   transaction.oncomplete();
   await pending;
   assert.equal(resolved,true);
 }finally{globalThis.indexedDB=original;}
});
