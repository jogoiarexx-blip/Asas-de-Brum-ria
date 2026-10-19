import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCameraPosition,moveFlightWithCollisions} from '../src/utils/spatialSweep.js';

const tree={x:6,z:0,bottom:0,top:5.2,radius:.82,type:'tree'};
const rock={...tree,type:'rock'};

test('camera avoids visible tree crowns rather than only the trunk collider',()=>{
  const a={x:0,y:4,z:0},b={x:12,y:4,z:0};
  const behindTrunk=resolveCameraPosition(a,b,[rock],()=>-100,{radius:.45,groundClearance:1.1});
  const behindCrown=resolveCameraPosition(a,b,[tree],()=>-100,{radius:.45,groundClearance:1.1});
  assert.equal(behindCrown.clipped,true);
  assert.ok(behindCrown.x<behindTrunk.x-1,JSON.stringify({behindCrown,behindTrunk}));
  assert.ok(behindCrown.x>1);
});
test('camera may fly over trees and still respects physical tree trunk collision',()=>{
  const a={x:0,y:18,z:0},b={x:12,y:18,z:0};
  const view=resolveCameraPosition(a,b,[tree],()=>-100,{radius:.45,groundClearance:1.1});
  assert.equal(view.clipped,false);
  assert.equal(view.x,12);
  const fly=moveFlightWithCollisions({x:0,y:4,z:0},{x:3.3,y:0,z:0},.35,.35,[tree],()=>-100);
  assert.ok(Math.abs(fly.x-3.3)<.001,'Copa não deve bloquear dragão quando a hitbox original está livre');
});
test('non-tree obstacles still have their original camera shape',()=>{
  const start={x:0,y:4,z:0},desired={x:12,y:4,z:0};
  const a=resolveCameraPosition(start,desired,[rock],()=>-100);
  const b=resolveCameraPosition(start,desired,[{...rock,type:'cabin'}],()=>-100);
  assert.deepEqual(a,b);
});
