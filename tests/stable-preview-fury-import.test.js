import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('prévia 3D usa a mesma API groundHeightAt do World real',()=>{
  const preview=read('../src/ui/StablePreview.js');
  const dragon=read('../src/entities/Dragon.js');
  assert.match(preview,/groundHeightAt:.*=>-2/);
  assert.match(dragon,/world\.groundHeightAt\(8,7,1\.65\)/);
});
test('GitHub Pages usa Three.js válido e GLTFLoader local ou CDN com fallback',()=>{
  const main=read('../src/main.js');
  const gltf=read('../src/entities/dragonAssetLoader.js');
  assert.match(main,/location\.hostname\.endsWith\('\.github\.io'\)/);
  assert.match(main,/!IS_STATIC_PAGES\?\[new URL\('\.\.\/vendor\/three\.module\.js'/);
  assert.match(gltf,/GLTFLoader\.js/);
  // Modern deployments bundle the loader to avoid another CDN dependency;
  // older deployments fall back to remote mirrors without requesting 404.
  if(gltf.includes('const localLoader=')){
    assert.match(gltf,/const urls=\[localLoader,\.\.\.mirrors\]/);
    assert.ok(read('../vendor/addons/loaders/GLTFLoader.js').includes('GLTFLoader'));
  }else{
    assert.match(gltf,/!isPages\?\[new URL\('\.\.\/\.\.\/vendor\/addons\/loaders\/GLTFLoader\.js'/);
  }
});
test('carregamento manual por espécie persiste e nunca desbloqueia Fúria da Luz sozinho',()=>{
  const models=read('../src/entities/SpeciesDragonModels.js');
  const ui=read('../src/ui/UI.js');
  const html=read('../index.html');
  assert.match(models,/async installUploaded\(id,bytes,\{previewDragon=null\}=\{\}\)/);
  assert.match(models,/loadSpeciesModel\(id\)/);
  assert.match(models,/saveSpeciesModel\(id,raw\)/);
  assert.match(models,/info\.animationCount!==8/);
  assert.match(models,/skin\.joints\?\.length===49/);
  assert.match(ui,/furia_noite','night-fury-glb-import'/);
  assert.match(ui,/furia_luz','light-fury-glb-import'/);
  assert.match(ui,/!game\.progression\.unlocked\.includes\(species\)/);
  assert.match(html,/id="fury-glb-status"/);
  assert.match(html,/id="night-fury-glb-file"/);
  assert.match(html,/id="light-fury-glb-file"/);
});
