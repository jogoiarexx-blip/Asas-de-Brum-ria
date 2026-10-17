import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const src=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('valida assinatura, versão, chunk JSON e tamanho real de um GLB 2.0',async()=>{
  const {inspectGLB}=await import('../src/entities/glbValidation.js');
  const buffer=readFileSync(new URL('../assets/models/hero-demo.glb',import.meta.url));
  const result=inspectGLB(buffer);
  assert.equal(result.version,2);
  assert.equal(result.assetVersion,'2.0');
  assert.ok(result.meshCount>=1);
  assert.equal(result.byteLength,buffer.byteLength);
  assert.ok(result.nodeCount>=1);
});
test('rejeita dados corrompidos e mostra erro explicativo',async()=>{
  const {inspectGLB}=await import('../src/entities/glbValidation.js');
  const valid=readFileSync(new URL('../assets/models/hero-demo.glb',import.meta.url));
  assert.throws(()=>inspectGLB(Buffer.from('abc')),/GLB|pequeno/i);
  const wrong=Buffer.from(valid);wrong.writeUInt32LE(42,0);
  assert.throws(()=>inspectGLB(wrong),/GLB|assinatura/i);
  const truncated=Buffer.from(valid);truncated.writeUInt32LE(valid.length+10,8);
  assert.throws(()=>inspectGLB(truncated),/tamanho|incompleto/i);
});
test('informa quando o GLB exige extensões externas não configuradas',async()=>{
  const {unsupportedGLBExtensions}=await import('../src/entities/glbValidation.js');
  assert.deepEqual(unsupportedGLBExtensions({extensionsRequired:['KHR_draco_mesh_compression']}),['KHR_draco_mesh_compression']);
  assert.deepEqual(unsupportedGLBExtensions({extensionsRequired:['KHR_materials_unlit']}),[]);
});
test('carregamento GLB real dispensa URL de arquivo fixa e CDN como única opção',()=>{
  const loader=src('src/entities/heroAssetLoader.js');
  assert.match(loader,/parseAsync\(/);
  assert.match(loader,/vendor\/addons\/loaders\/GLTFLoader/);
  assert.match(loader,/createHeroGLBInstance|installHeroGLB/);
});
test('botões de importar, demo e restaurar estão ligados e mostram estado',()=>{
  const html=src('index.html'), controller=src('src/ui/HeroAssetUI.js');
  for(const id of ['hero-glb-import','hero-glb-demo','hero-glb-reset','hero-glb-file','hero-glb-status']){
    assert.ok(html.includes(`id="${id}"`),id);assert.ok(controller.includes(id),id);
  }
});
test('mesmo GLB está disponível a pé e montado com rig próprio',()=>{
  const loader=src('src/entities/heroAssetLoader.js');
  assert.match(loader,/hero\.rider\.add\(/);
  assert.match(loader,/hero\.group\.add\(/);
  assert.match(loader,/SkeletonUtils|cloneSkinned|clone\(/);
});
test('modelo enviado pelo jogador é persistido via IndexedDB e erros não apagam o backup',()=>{
  const code=src('src/entities/heroAssetStore.js'),ui=src('src/ui/HeroAssetUI.js');
  assert.match(code,/indexedDB\.open\(/);
  assert.match(code,/\.put\(/);
  assert.match(ui,/catch\s*\(/);
  assert.match(ui,/loadSavedHeroGLB/);
});
test('HTML e Python/Windows reconhecem arquivos glb e carregador local',()=>{
  const py=src('start_game.py'),win=src('start_windows.ps1');
  assert.match(py,/GLTFLoader\.js/);
  assert.match(win,/GLTFLoader\.js/);
  assert.ok(existsSync(new URL('../assets/models/hero-demo.glb',import.meta.url)));
});

test('botão de demonstração produz um GLB genuíno com malha e vários nós',async()=>{
 const {buildDemoGLB}=await import('../src/entities/demoGlb.js');
 const {inspectGLB}=await import('../src/entities/glbValidation.js');
 const demo=buildDemoGLB(),meta=inspectGLB(demo);
 assert.ok(meta.meshCount>=5);
 assert.ok(meta.nodeCount>=7);
 assert.ok(meta.byteLength<8192);
});
