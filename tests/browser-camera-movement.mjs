import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
const page=await browser.newPage({viewport:{width:1200,height:720}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.route('**/src/main.js',async route=>{
  const response=await route.fetch(),source=await response.text();
  if(!source.includes('new Game();'))throw Error('QA Game hook missing');
  await route.fulfill({response,body:source.replace('new Game();','window.__cameraQAGame=new Game();')});
});
try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.__cameraQAGame,null,{timeout:30000});
  await page.waitForFunction(()=>window.__cameraQAGame?.dragon?.externalDragonModel?.species==='furia_noite',null,{timeout:45000});
  const result=await page.evaluate(()=>{
    const game=window.__cameraQAGame,hero=game.hero,dragon=game.dragon;
    const flat={groundHeightAt:()=>0,heightAt:()=>0,walkable:()=>true,clearanceAt:()=>-Infinity,obstacles:[]};
    const old={
      heroWorld:hero.world,heroPos:hero.group.position.clone(),heroYaw:hero.group.rotation.y,
      dragonWorld:dragon.world,dragonPos:dragon.group.position.clone(),dragonYaw:dragon.yaw,
      dragonSpeed:dragon.speed,dragonRiding:dragon.riding,dragonAirborne:dragon.airborne,
      dragonPose:dragon.pose,orbitYaw:game.cameraOrbit.yaw
    };
    const input=(x,z,yaw)=>({
      cameraYaw:yaw,
      axis:(negative,positive)=>negative==='w'?z:x,
      isDown:()=>false
    });
    const runHero=(yaw,x,z)=>{
      hero.world=flat;hero.mounted=false;
      hero.group.position.set(0,0,0);hero.group.rotation.y=0;
      const press=input(x,z,yaw);
      for(let i=0;i<60;i++)hero.update(1/60,press,i/60);
      return {x:hero.group.position.x,z:hero.group.position.z,yaw:hero.group.rotation.y};
    };
    const runDragon=(yaw,x,z,airborne=false)=>{
      dragon.world=flat;
      dragon.group.position.set(0,airborne?15:2.58,0);
      dragon.yaw=0;dragon.speed=0;dragon.airborne=airborne;dragon.takeoffTime=airborne?2:0;
      dragon.mount();
      const press=input(x,z,yaw);
      for(let i=0;i<145;i++)dragon.update(1/60,press,i/60);
      return {x:dragon.group.position.x,z:dragon.group.position.z,
        yaw:dragon.yaw,speed:dragon.speed,airborne:dragon.airborne,
        heading:{x:dragon.forward().x,z:dragon.forward().z}};
    };
    let results;
    try{
      // 90-degree orbit: W points west (-X) for both hero and dragon.
      game.cameraOrbit.yaw=Math.PI/2;
      const heroWest=runHero(game.cameraOrbit.yaw,0,-1);
      const heroNorth=runHero(0,0,-1);
      const heroSouth=runHero(Math.PI,0,-1);
      const heroRight=runHero(Math.PI/2,1,0);
      const dragonWest=runDragon(Math.PI/2,0,-1);
      const dragonNorth=runDragon(0,0,-1);
      const dragonBrake=runDragon(0,0,1,true);
      results={heroWest,heroNorth,heroSouth,heroRight,dragonWest,dragonNorth,dragonBrake};
    }finally{
      hero.world=old.heroWorld;hero.group.position.copy(old.heroPos);hero.group.rotation.y=old.heroYaw;
      dragon.world=old.dragonWorld;dragon.group.position.copy(old.dragonPos);
      dragon.yaw=old.dragonYaw;dragon.speed=old.dragonSpeed;
      dragon.riding=old.dragonRiding;dragon.airborne=old.dragonAirborne;
      dragon.pose=old.dragonPose;dragon.group.rotation.y=old.dragonYaw;
      game.cameraOrbit.yaw=old.orbitYaw;
    }
    return results;
  });
  assert.ok(result.heroWest.x<-3&&Math.abs(result.heroWest.z)<.5,JSON.stringify(result));
  assert.ok(result.heroNorth.z<-3&&Math.abs(result.heroNorth.x)<.5,JSON.stringify(result));
  assert.ok(result.heroSouth.z>3&&Math.abs(result.heroSouth.x)<.5,JSON.stringify(result));
  assert.ok(result.heroRight.z<-3&&Math.abs(result.heroRight.x)<.5,JSON.stringify(result));
  assert.ok(result.dragonWest.x<-3&&result.dragonWest.heading.x<-.85,
    'mounted dragon does not steer into camera heading: '+JSON.stringify(result));
  assert.ok(result.dragonNorth.z<-3&&result.dragonNorth.heading.z<-.9,JSON.stringify(result));
  assert.ok(result.dragonBrake.speed<5,'S must still brake the airborne dragon');
  assert.deepEqual(errors,[],'Browser/WebGL console errors');
  console.log('CAMERA_RELATIVE_BROWSER_PASS',JSON.stringify(result));
}catch(error){
  console.error('CAMERA_RELATIVE_BROWSER_FAILURE',error);
  throw error;
}finally{await browser.close();}
