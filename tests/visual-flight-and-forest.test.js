import test from 'node:test';
import assert from 'node:assert/strict';
import {treeVariant,treeCrownPose} from '../src/world/TreeVariation.js';
import {wingPose} from '../src/entities/wingPose.js';

test('árvores têm variantes determinísticas sem alterar a posição',()=>{
  for(let i=0;i<80;i++){
    const tree={x:i*3.13-40,z:i*7.31-70,size:.8+i%5*.15,palette:i%4};
    assert.deepEqual(treeVariant(tree),treeVariant({...tree}));
    for(let layer=0;layer<2;layer++){
      const pose=treeCrownPose(tree,layer);
      for(const key of ['dx','dz','y','sx','sy','sz','yaw'])assert.ok(Number.isFinite(pose[key]),key);
      assert.ok(pose.sx>.5&&pose.sx<1.6);
      assert.ok(pose.y>2.5&&pose.y<5);
    }
  }
});
test('copas de dois tipos presentes com distribuição estável',()=>{
  const kinds=new Set(Array.from({length:90},(_,i)=>treeVariant({x:11.3+i*1.23,z:-8.7+i*2.71,palette:i%4}).kind));
  assert.deepEqual([...kinds].sort(),['broadleaf','conifer']);
});
test('pivôs das asas têm amplitude finita e simetria lateral',()=>{
  for(const phase of ['ground','takeoff','cruise','landing']){
    for(const speed of [0,15,38,60]){
      const a=wingPose({time:1.42,side:1,phase,speed,bank:0,wingLift:.5,climbing:2});
      const b=wingPose({time:1.42,side:-1,phase,speed,bank:0,wingLift:.5,climbing:2});
      for(const key of ['shoulder','elbow','wrist','twist','sweep','elbowTwist','wristYaw'])assert.ok(Number.isFinite(a[key]),`${phase} ${key}`);
      assert.ok(Math.abs(a.shoulder+b.shoulder)<1e-9);
      assert.ok(Math.abs(a.sweep+b.sweep)<1e-9);
      assert.ok(Math.abs(a.wristYaw+b.wristYaw)<.09);
    }
  }
});
test('planar em velocidade alta modifica o perfil sem alterar o contrato anterior',()=>{
  const glide=wingPose({phase:'cruise',speed:38,climbing:0,time:.7});
  const climb=wingPose({phase:'cruise',speed:38,climbing:12,time:.7});
  assert.equal(glide.glide,true);
  assert.equal(climb.glide,false);
  assert.ok(Math.abs(glide.sweep)>.07);
  assert.ok('shoulder' in glide&&'elbow' in glide&&'wrist' in glide&&'twist' in glide);
});
