import * as THREE from 'three';
import {WEATHER_MODES,weatherMode,normalizeWeather,advanceWeather,nextWeather} from './weatherMath.js';
import {skyLighting} from './dayCycleMath.js';

/** Chuva e relâmpagos exclusivamente locais, sem texturas externas ou partículas infinitas. */
export class Weather {
  constructor(scene,world,camera,initial){
    this.scene=scene;this.world=world;this.camera=camera;
    this.state=normalizeWeather(initial);this.mode=weatherMode(this.state.mode);
    this.flashTime=0;this.flashCooldown=17;this.weatherChanges=0;
    this.seed=8521;this.count=matchMedia('(pointer:coarse)').matches?100:260;
    this.positions=new Float32Array(this.count*3);
    this.speed=new Float32Array(this.count);
    this.reseed();
    this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    this.material=new THREE.PointsMaterial({color:0xb4d9ee,size:.7,transparent:true,opacity:.70,depthWrite:false,fog:true,sizeAttenuation:true});
    this.rain=new THREE.Points(this.geometry,this.material);this.rain.frustumCulled=false;
    this.rain.visible=false;scene.add(this.rain);
    this.flash=new THREE.PointLight(0xe7efff,0,600);this.flash.position.set(0,130,0);scene.add(this.flash);
  }
  random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  reseed(){for(let i=0;i<this.count;i++){
    this.positions[i*3]=(this.random()-.5)*130;
    this.positions[i*3+1]=this.random()*90-20;
    this.positions[i*3+2]=(this.random()-.5)*130;
    this.speed[i]=35+this.random()*32;
  }}
  snapshot(){return {...this.state};}
  cycle(){this.state={mode:nextWeather(this.state.mode),elapsed:0};this.mode=weatherMode(this.state.mode);this.weatherChanges++;return this.mode.label;}
  update(dt,time,focus,dayPhase){
    const previous=this.state.mode;
    this.state=advanceWeather(this.state,dt);this.mode=weatherMode(this.state.mode);
    if(previous!==this.state.mode)this.weatherChanges++;
    const desired=this.mode;
    const lighting=skyLighting(dayPhase??.5,desired);
    this.scene.background.lerp(new THREE.Color(lighting.sky),Math.min(1,dt*.6));
    this.scene.fog.color.lerp(new THREE.Color(lighting.fog),Math.min(1,dt*.6));
    this.scene.fog.density=THREE.MathUtils.damp(this.scene.fog.density,desired.rain?0.00255:0.00165,.5,dt);
    this.world.sun.intensity=THREE.MathUtils.damp(this.world.sun.intensity,lighting.sun,.55,dt);
    this.world.sky.intensity=THREE.MathUtils.damp(this.world.sky.intensity,lighting.hemisphere,.55,dt);
    this.world.cloudWind=1+desired.wind*3;
    this.world.sun.color.lerp(new THREE.Color(lighting.sunColor),Math.min(1,dt*.65));
    const wet=desired.rain>0;
    this.rain.visible=wet;
    if(wet){
      // Coordenadas da chuva são relativas ao jogador para evitar renderizar todo o mundo.
      this.rain.position.set(focus.x,focus.y+20,focus.z);
      this.material.opacity=.35+desired.rain*.44;
      for(let i=0;i<this.count;i++){
        let y=this.positions[i*3+1]-this.speed[i]*dt*(1+desired.rain*.3);
        if(y<-25){y+=90;this.positions[i*3]=(this.random()-.5)*130;this.positions[i*3+2]=(this.random()-.5)*130;}
        this.positions[i*3+1]=y;
        this.positions[i*3]+=.9*desired.wind*dt;
        if(this.positions[i*3]>65)this.positions[i*3]-=130;
      }
      this.geometry.attributes.position.needsUpdate=true;
    }
    this.flashCooldown-=dt;
    if(desired.id==='storm'&&this.flashCooldown<=0){
      this.flashTime=.17;this.flashCooldown=12+this.random()*14;
      this.flash.position.set(focus.x+50,focus.y+120,focus.z-40);
    }
    this.flashTime=Math.max(0,this.flashTime-dt);
    this.flash.intensity=this.flashTime>0?15*this.flashTime/.17:0;
    return previous!==this.state.mode;
  }
  dispose(){this.scene.remove(this.rain,this.flash);this.geometry.dispose();this.material.dispose();}
}
