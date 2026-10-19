import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDemoGLB} from '../src/entities/demoGlb.js';
import {modelReportGLB,validateOptimized} from '../tools/modelPipeline.mjs';

test('inspeciona GLB original e mede polígonos, materiais e compatibilidade',()=>{
  const glb=buildDemoGLB(),report=modelReportGLB(glb);
  assert.equal(report.assetVersion,'2.0');
  assert.equal(report.meshCount,5);
  assert.equal(report.nodeCount,8);
  assert.equal(report.primitives,5);
  assert.equal(report.triangles,60);
  assert.equal(report.vertices,40);
  assert.equal(report.materials,5);
  assert.equal(report.animationCount,0);
  assert.ok(report.warnings.some(x=>/animações/.test(x)));
});
test('validação segura permite modelo compatível sem destruir seus dados',()=>{
  const a=buildDemoGLB();
  const report=validateOptimized(a,a);
  assert.equal(report.savingPercent,0);
  assert.equal(report.bytesSaved,0);
  assert.equal(report.after.primitives,report.before.primitives);
});
test('rejeita GLB malformado sem impactar importador do jogo',()=>{
  const glb=buildDemoGLB(),invalid=glb.slice();
  invalid[0]=0;
  assert.throws(()=>modelReportGLB(invalid),/GLB inválida/);
  const short=new Uint8Array(10);
  assert.throws(()=>modelReportGLB(short),/muito pequeno/);
});
