import * as THREE from 'three';
import { Input } from './Input.js';
import {CameraOrbit,cameraOffset} from './CameraOrbit.js';
import {safeDismountSpot} from '../utils/surfaces.js';
import { World } from '../world/World.js';
import { Dragon } from '../entities/Dragon.js';
import { EnemySquad } from '../entities/EnemyDragon.js';
import { Hero } from '../entities/Hero.js';
import { Missions } from '../systems/Missions.js';
import { AudioSystem } from '../systems/Audio.js';
import { Effects } from '../systems/Effects.js';
import {segmentSphereHit} from '../systems/combatMath.js';
import { UI } from '../ui/UI.js';
import {Progression,SPECIES,REWARDS} from '../systems/Progression.js';
import {SaveSystem} from '../systems/SaveSystem.js';
import {Training,CIRCUITS} from '../systems/Training.js';
import {VillageContracts,CONTRACTS} from '../systems/VillageContracts.js';
import {VillageNPCs} from '../entities/VillageNPCs.js';
import { smoothFollow } from '../utils/math.js';
import {Weather} from '../systems/Weather.js';
import {Discovery} from '../systems/Discovery.js';
import {Landmarks} from '../world/Landmarks.js';
import {DayNight} from '../systems/DayNight.js';
import {StablePreview} from '../ui/StablePreview.js';
import {GraphicsQuality} from '../systems/GraphicsQuality.js';
import {WildBonds} from '../systems/WildBonds.js';
import {WildDragons} from '../entities/WildDragons.js';

export class Game {
  constructor() {
    this.container=document.getElementById('game');
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.2:1.65));
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.23;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9bdbef);this.scene.fog=new THREE.FogExp2(0xa3e2ed,.00165);
    this.camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.15,1050);
    this.input=new Input();this.audio=new AudioSystem();this.ui=new UI();
    this.cameraOrbit=new CameraOrbit();this.bindOrbitControls();
    this.graphics=new GraphicsQuality(this.renderer,window.devicePixelRatio||1,matchMedia('(pointer:coarse)').matches,navigator.deviceMemory??0);
    this.updateGraphicsLabel();
    this.saveSystem=new SaveSystem();this.savedData=this.saveSystem.read();
    this.progression=new Progression(this.savedData?.progression);this.autoSaveTime=0;this.lastSaveOk=null;
    this.world=new World(this.scene);
    this.weather=new Weather(this.scene,this.world,this.camera,this.savedData?.weather);
    this.dayNight=new DayNight(this.scene,this.world,this.savedData?.dayNight);
    this.discovery=new Discovery(this.savedData?.discoveries);
    this.wildBonds=new WildBonds(this.savedData?.wildBonds);
    this.landmarks=new Landmarks(this.scene,this.world);
    this.dragon=new Dragon(this.scene,this.world);
    this.hero=new Hero(this.scene,this.world,this.dragon);
    this.enemies=new EnemySquad(this.scene,this.world);
    this.effects=new Effects(this.scene);
    this.contracts=new VillageContracts(this.savedData?.contracts);
    this.villagers=new VillageNPCs(this.scene,this.world);
    this.wildDragons=new WildDragons(this.scene,this.world,this.wildBonds);
    this.villagers.refresh(this.contracts);
    this.missions=new Missions(this.scene,this.audio,()=>{if(this.missions)this.ui.updateQuest(this.missions);},this.enemies,
      stage=>{this.progression.grant(REWARDS[stage]??1);this.saveGame();this.ui.toast(`Missão concluída! +${REWARDS[stage]??1} ponto(s) de treino.`,4);});
    this.training=new Training(this.scene,()=>{},(mode,reward)=>{
      this.progression.grant(reward);this.progression.circuits++;
      if(mode==='basic')this.missions.trainingCompleted();
      this.saveGame();this.ui.renderStable(this);
    });
    this.dragon.setSpecies(this.progression.species,SPECIES[this.progression.species]);
    this.dragon.setStats(this.progression.stats);
    this.ui.connectStable(this);
    this.stablePreview=null;
    if(this.savedData){document.getElementById('start-btn').firstChild.textContent='CONTINUAR AVENTURA ';document.getElementById('new-game-btn').classList.remove('hidden');}
    document.getElementById('new-game-btn').addEventListener('click',()=>this.newGame());
    this.projectiles=[];this.clock=new THREE.Clock();this.started=false;this.elapsed=0;this.fpsTime=0;this.frames=0;
    this.health=100;this.maxHealth=100;this.hurtImmunity=0;this.hitFlash=0;this.needsProjectileClear=false;
    if(this.savedData)this.restoreSave(this.savedData);
    this.projectileGeometry=new THREE.IcosahedronGeometry(.9,1);
    this.projectileMaterials={player:new THREE.MeshBasicMaterial({color:0xffb65a}),enemy:new THREE.MeshBasicMaterial({color:0xf06ca9})};
    this.camera.position.set(6,24,38);this.camera.lookAt(0,12,0);
    window.addEventListener('resize',()=>this.onResize());
    document.getElementById('quality-toggle').addEventListener('click',()=>this.cycleGraphics());
    window.addEventListener('pagehide',()=>this.saveGame());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.saveGame();});
    document.getElementById('start-btn').addEventListener('click',()=>this.start());
    this.ui.updateQuest(this.missions);
    this.renderer.setAnimationLoop(()=>this.frame());
  }
  bindOrbitControls(){
    // Orbit only on the canvas: HUD buttons and the stable panel remain clickable.
    const canvas=this.renderer.domElement;
    let pointerId=null,lastX=0,lastY=0;
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',event=>{
      if(!this.started||event.button!==0||!this.ui.stable.classList.contains('hidden'))return;
      pointerId=event.pointerId;lastX=event.clientX;lastY=event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove',event=>{
      if(pointerId!==event.pointerId||!this.started)return;
      this.cameraOrbit.drag(event.clientX-lastX,event.clientY-lastY);
      lastX=event.clientX;lastY=event.clientY;
    });
    const release=event=>{if(pointerId===event.pointerId)pointerId=null;};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
    canvas.addEventListener('wheel',event=>{
      if(!this.started)return;
      event.preventDefault();this.cameraOrbit.zoomBy(event.deltaY);
    },{passive:false});
  }
  start(){
    this.started=true;document.getElementById('start-screen').classList.add('hidden');
    this.audio.unlock();this.ui.toast(this.savedData?'Progresso recuperado! Aperte T para acessar o estábulo.':'Encontre Nimbo, seu dragão. Pressione E para montar!',5);
    this.input.clearActions();
  }
  newGame(){
    if(!window.confirm('Apagar o progresso salvo e iniciar uma nova aventura?'))return;
    this.saveSystem.clear();window.location.reload();
  }
  nearStable(){
    const p=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
    return Math.hypot(p.x,p.z)<65 && (!this.dragon.riding||!this.dragon.airborne);
  }
  toggleStable(){
    const open=this.ui.stable.classList.contains('hidden');
    this.ui.stable.classList.toggle('hidden',!open);
    if(open){this.ui.renderStable(this);
      try{this.stablePreview??=new StablePreview(document.getElementById('stable-preview-canvas'));
        this.stablePreview.showSpecies(this.progression.species);
      }catch(error){console.warn('Prévia 3D indisponível:',error);document.getElementById('stable-preview-caption').textContent='A prévia 3D não está disponível neste dispositivo.';}
      this.input.down.clear();this.input.clearActions();}
  }
  buySkill(id){
    if(!this.nearStable()){this.ui.toast('Para treinar, volte ao estábulo da vila.');return;}
    const result=this.progression.upgrade(id);
    if(result.ok){this.dragon.setStats(this.progression.stats);this.audio.play('complete');this.saveGame();}
    this.ui.toast(result.ok?'Habilidade melhorada!':result.reason);
    this.ui.renderStable(this);
  }
  chooseSpecies(id){
    if(!this.nearStable()){this.ui.toast('Troque de dragão somente no estábulo da vila.');return;}
    if(this.progression.species===id)return;
    if(!this.progression.unlocked.includes(id)){
      const result=this.progression.unlock(id);
      if(!result.ok){this.ui.toast(result.reason);return;}
    }
    this.progression.select(id);this.dragon.setSpecies(id,SPECIES[id]);this.dragon.setStats(this.progression.stats);
    this.stablePreview?.showSpecies(id);
    this.saveGame();this.audio.play('mount');this.ui.toast(`${SPECIES[id].name} é agora seu companheiro!`,4);this.ui.renderStable(this);
  }
  startTraining(mode='basic'){
    if(mode==='advanced'&&this.progression.circuits<1){this.ui.toast('Conclua primeiro o Desafio dos Ventos.');return;}
    if(!this.nearStable()){this.ui.toast('Para começar o circuito, retorne à vila e pouse.');return;}
    const result=this.training.start(mode);
    if(result.ok){this.ui.stable.classList.add('hidden');this.ui.toast(`${CIRCUITS[mode].label}: atravesse ${CIRCUITS[mode].checkpoints.length} aros em ${CIRCUITS[mode].seconds} segundos!`,6);this.saveGame();}
    else this.ui.toast(result.reason);
  }
  saveGame(manual=false){
    if(!this.started&&!manual)return false;
    const p=this.dragon.group.position,h=this.hero.group.position;
    const payload={version:1,savedAt:new Date().toISOString(),mission:this.missions.snapshot(),progression:this.progression.snapshot(),
      contracts:this.contracts.snapshot(),weather:this.weather.snapshot(),dayNight:this.dayNight.snapshot(),discoveries:this.discovery.snapshot(),
      wildBonds:this.wildBonds.snapshot(),
      player:{x:p.x,y:p.y,z:p.z,yaw:this.dragon.yaw,health:this.health,energy:this.dragon.energy,mounted:this.dragon.riding,airborne:this.dragon.airborne,heroX:h.x,heroZ:h.z}};
    this.lastSaveOk=this.saveSystem.write(payload);
    if(manual)this.ui.toast(this.lastSaveOk?'Partida salva neste navegador.':'Não foi possível salvar: armazenamento indisponível.');
    return this.lastSaveOk;
  }
  restoreSave(data){
    this.missions.restore(data.mission);
    this.contracts.restore(data.contracts);this.villagers.refresh(this.contracts);
    const p=data.player;
    this.dragon.group.position.set(p.x,Math.max(p.y,this.world.groundHeightAt(p.x,p.z)+2.58),p.z);
    this.dragon.yaw=p.yaw;this.dragon.group.rotation.y=p.yaw;
    this.dragon.airborne=p.mounted&&p.airborne;this.dragon.energy=Math.min(this.progression.stats.maxEnergy,p.energy);
    this.hero.group.position.set(p.heroX,this.world.groundHeightAt(p.heroX,p.heroZ,.52),p.heroZ);
    if(p.mounted){this.dragon.mount();this.hero.setMounted(true);}
    this.health=p.health;
  }
  updateGraphicsLabel(){document.getElementById('quality-toggle').textContent=`GRÁFICOS: ${this.graphics.label} · G`;}
  cycleGraphics(){this.graphics.cycle();this.updateGraphicsLabel();this.ui.toast(`Qualidade: ${this.graphics.label}`,3);}
  onResize(){
    this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);
    this.graphics.onResize(window.devicePixelRatio||1);
  }
  interactVillager(){
    if(this.dragon.riding)return false;
    const npc=this.villagers.nearby(this.hero.group.position,5.5);
    if(!npc)return false;
    const result=this.contracts.talk(npc.spec.id);
    if(!result)return false;
    if(result.action==='reward'){
      this.progression.grant(result.reward);
      if(result.key==='ervas')this.health=Math.min(100,this.health+40);
      this.audio.play('complete');
    }
    if(result.action==='accepted'||result.action==='reward'){
      this.villagers.refresh(this.contracts);this.saveGame();
    }
    this.ui.showDialogue(npc.spec.name,npc.spec.role,result.text);
    this.ui.renderStable(this);
    return true;
  }
  interactWildDragon(){
    if(this.dragon.riding)return false;
    const creature=this.wildDragons.nearby(this.hero.group.position,8.2);
    if(!creature)return false;
    const distance=this.hero.group.position.distanceTo(creature.group.position);
    const ready=this.wildDragons.approach.ready(creature.spec.id,distance);
    if(!ready){
      const mood=this.wildDragons.approach.get(creature.spec.id);
      this.ui.toast(mood.mood==='assustado'?`${creature.spec.name} se assustou! Espere e aproxime-se devagar com SHIFT.`:`Fique perto de ${creature.spec.name} até ganhar confiança${creature.spec.id==='nimbo'?' (segure SHIFT para andar devagar)':''}.`,4);
      return true;
    }
    const result=this.wildBonds.bond(creature.spec.id,this.elapsed,ready);
    if(!result.ok){this.ui.toast(result.reason,3);return true;}
    this.wildDragons.approach.onBond(creature.spec.id);
    this.effects.burst(creature.group.position.clone().add(new THREE.Vector3(0,2.5,0)),'rescue',12);
    this.audio.play(result.completed?'complete':'pickup');
    if(result.completed){
      const newlyUnlocked=this.progression.discover(creature.spec.species);
      this.progression.grant(1);
      this.ui.toast(`${creature.spec.name} confia em você! ${newlyUnlocked?'Espécie liberada no estábulo. ':''}+1 ponto de treino · ${this.wildBonds.total}/3`,6);
      this.ui.renderStable(this);
    }else this.ui.toast(`${creature.spec.name}: confiança ${result.progress}/3 · aguarde um instante para novo carinho.`,4);
    this.saveGame();
    return true;
  }
  updateContracts(){
    const position=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
    for(const [key,def] of Object.entries(CONTRACTS)){
      if(this.contracts.state[key].status!=='active'||this.dragon.riding!==def.requiresMount)continue;
      for(let i=0;i<def.points.length;i++){
        if(this.contracts.state[key].collected[i])continue;
        const marker=this.villagers.markers.find(m=>m.id===key&&m.index===i);
        if(marker&&position.distanceTo(marker.group.position)<(def.requiresMount?10:3.7)&&this.contracts.collect(key,i,this.dragon.riding)){
          this.audio.play('pickup');this.effects.burst(marker.group.position,'fire',9);
          this.villagers.refresh(this.contracts);
          const state=this.contracts.state[key];
          const done=state.collected.filter(Boolean).length;
          this.ui.toast(state.status==='ready'?`Objetivos completos! Retorne para ${key==='correio'?'Iara':'Lume'} receber sua recompensa.`:`${def.title}: ${done}/${def.points.length}`,4);
          this.saveGame();break;
        }
      }
    }
  }
  mountOrDismount(){
    if(!this.dragon.riding){
      const distance=this.hero.group.position.distanceTo(this.dragon.group.position);
      if(distance>10.5){this.ui.toast('Aproxime-se do dragão para montar.');this.audio.play('error');return;}
      this.dragon.mount();this.hero.setMounted(true);this.audio.play('mount');this.saveGame();
      if(this.missions.finishBond())this.ui.toast('Nimbo confia em você! Atravesse o primeiro aro luminoso.',5);
      else this.ui.toast('Montado! W acelera · Espaço sobe · Ctrl desce.');
      return;
    }
    const {x,z,y}=this.dragon.group.position;
    const h=this.world.groundHeightAt(x,z);
    if(this.dragon.airborne || y-h>4.7 || this.dragon.speed>11 || !this.world.walkable(x,z)){
      this.ui.toast('Para desmontar: pouse numa ilha e reduza a velocidade.');this.audio.play('error');return;
    }
    const spot=safeDismountSpot({x,z},{obstacles:this.world.obstacles,walkable:(a,b)=>this.world.walkable(a,b),groundAt:(a,b)=>this.world.groundHeightAt(a,b,.52)});
    if(!spot){this.ui.toast('Não há espaço livre para desmontar aqui. Mova Nimbo para um local aberto.');this.audio.play('error');return;}
    this.hero.group.position.set(spot.x,spot.y,spot.z);
    this.dragon.dismount();this.hero.setMounted(false);this.ui.toast('Você desmontou do dragão.');this.saveGame();
  }
  spawnProjectile(origin,direction,owner){
    const mesh=new THREE.Mesh(this.projectileGeometry,this.projectileMaterials[owner]);
    mesh.position.copy(origin);mesh.scale.setScalar(owner==='enemy'?1.9:1.5);
    const color=owner==='enemy'?0xf04eaa:0xff8b36;
    const light=new THREE.PointLight(color,8,14,2);mesh.add(light);
    this.scene.add(mesh);
    const speed=owner==='enemy'?56:95;
    this.projectiles.push({mesh,velocity:direction.clone().multiplyScalar(speed),life:owner==='enemy'?3.2:2.4,owner});
    if(owner==='enemy')this.audio.play('enemyFire');
    else this.audio.play('fire');
  }
  fire(){
    if(!this.dragon.riding){this.ui.toast('Monte no seu dragão primeiro.');return;}
    if(this.missions.stage<3){this.ui.toast('Fogo bloqueado: complete a missão das runas.');return;}
    if(this.dragon.fireCooldown>0)return;
    const stats=this.progression.stats;
    if(this.dragon.energy<stats.fireCost){this.ui.toast('Energia insuficiente para lançar fogo.');return;}
    this.dragon.fireCooldown=stats.fireCooldown;this.dragon.energy-=stats.fireCost;
    this.dragon.triggerAttack();
    this.projectileMaterials.player.color.setHex(this.progression.species==='brasa'?0xff6542:this.progression.species==='raio'?0x9dd8ff:0xffb65a);
    const direction=this.dragon.forward();
    // Assistência de mira limitada ao campo frontal. Exige apontar para o alvo.
    let best=null,bestDot=.77;
    let possible=[];
    if(this.missions.stage===3)possible=this.missions.targets.filter(t=>!t.userData.destroyed).map(t=>t.position);
    if(this.missions.stage===4)possible=this.enemies.alive.map(e=>e.position);
    for(const target of possible){
      const to=target.clone().sub(this.dragon.group.position);
      const distance=to.length(),dot=direction.dot(to.clone().normalize());
      if(distance<164&&dot>bestDot){best=to.normalize();bestDot=dot;}
    }
    if(best)direction.lerp(best,.86).normalize();
    const start=this.dragon.group.localToWorld(new THREE.Vector3(0,.48,-4.4));
    this.spawnProjectile(start,direction,'player');
    this.effects.burst(start,'fire',7);
  }
  takeDamage(amount){
    if(!this.dragon.riding||this.hurtImmunity>0)return false;
    this.hurtImmunity=.9;this.hitFlash=.5;this.health=Math.max(0,this.health-amount);
    this.dragon.triggerHurt();
    this.audio.play('hurt');
    this.effects.burst(this.dragon.group.position,'enemy',10);
    if(this.health<=0){
      this.health=100;this.resetPosition(true);
      this.needsProjectileClear=true;
      this.hurtImmunity=3;
      this.ui.toast('O dragão foi derrubado! Vocês voltaram à vila. A missão continua.',6);
    }else this.ui.toast(`O dragão sofreu dano! Resistência: ${this.health}%`,2);
    return true;
  }
  clearProjectiles(){
    for(const bullet of this.projectiles)this.scene.remove(bullet.mesh);
    this.projectiles.length=0;
  }
  updateProjectiles(dt){
    for(let i=this.projectiles.length-1;i>=0;i--){
      const bullet=this.projectiles[i];bullet.life-=dt;
      const from=bullet.mesh.position.clone();
      const to=from.clone().addScaledVector(bullet.velocity,dt);
      bullet.mesh.position.copy(to);bullet.mesh.rotation.x+=dt*7;
      bullet.mesh.scale.setScalar((bullet.owner==='enemy'?1.55:1.25)+Math.sin(bullet.life*26)*.13);
      let hit=false;
      if(bullet.owner==='player'){
        if(this.missions.stage===3){
          for(let k=0;k<this.missions.targets.length;k++){
            const target=this.missions.targets[k];
            if(!target.userData.destroyed&&segmentSphereHit(from,to,target.position,7.5)){
              this.effects.burst(target.position,'fire',15);
              this.missions.hitTarget(k);
              this.ui.toast(this.missions.complete?'TODAS AS MISSÕES CONCLUÍDAS!':`Orbe destruído!`,3);
              hit=true;break;
            }
          }
        }
        if(this.missions.stage===4){
          for(const enemy of this.enemies.alive){
            if(segmentSphereHit(from,to,enemy.position,5.6)){
              const dead=enemy.takeHit(this.progression.stats.fireDamage);
              this.effects.burst(enemy.position,dead?'fire':'impact',dead?22:9);
              this.audio.play('hit');
              if(dead){
                this.missions.enemyDefeated();
                this.ui.toast(this.missions.stage===5?'Céus seguros! Agora resgate os filhotes.':`Dragão sombrio derrotado! ${this.missions.progress}/3`,5);
              } else this.ui.toast(`Sentinela atingida · ${Math.ceil(enemy.health)}/${enemy.maxHealth} de resistência`,2);
              hit=true;break;
            }
          }
        }
      } else if(this.missions.stage===4&&this.dragon.riding&&segmentSphereHit(from,to,this.dragon.group.position,4.2)){
        this.takeDamage(16);hit=true;
      }
      if(hit||bullet.life<=0||to.y<-.9){this.scene.remove(bullet.mesh);this.projectiles.splice(i,1);}
    }
    if(this.needsProjectileClear){this.clearProjectiles();this.needsProjectileClear=false;}
  }
  updateDiscoveries(){
    const p=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
    const discovered=this.landmarks.tryDiscover(p,this.discovery);
    if(discovered){
      this.progression.grant(1);this.saveGame();this.audio.play('complete');
      this.ui.toast(`Novo marco: ${discovered.name}! +1 ponto de treinamento (${this.discovery.total}/5).`,5);
      this.ui.renderStable(this);
    }
  }
  updateCamera(dt){
    const riding=this.dragon.riding;
    const focus=riding?this.dragon.group.position:this.hero.group.position;
    const forward=riding?this.dragon.forward():new THREE.Vector3(0,0,-1);
    const back=(riding?16+this.dragon.speed*.095:12)*this.cameraOrbit.zoom;
    const offset=cameraOffset({forwardX:forward.x,forwardZ:forward.z,distance:back,yaw:this.cameraOrbit.yaw,pitch:this.cameraOrbit.pitch});
    const camPos=new THREE.Vector3(focus.x+offset.x,focus.y+(riding?7.6:7.1)+offset.y,focus.z+offset.z);
    camPos.y=Math.max(camPos.y,this.world.groundHeightAt(camPos.x,camPos.z)+3.5);
    this.camera.position.lerp(camPos,smoothFollow(riding?3.1:5,dt));
    const lookAt=new THREE.Vector3(focus.x+forward.x*(riding?9:0),focus.y+(riding?2.3:2),focus.z+forward.z*(riding?9:0));
    this._camTarget??=lookAt.clone();this._camTarget.lerp(lookAt,smoothFollow(4,dt));
    this.camera.lookAt(this._camTarget);
    const fov=riding?67+Math.min(this.dragon.speed*.24,11):67;
    this.camera.fov=THREE.MathUtils.damp(this.camera.fov,fov,3,dt);this.camera.updateProjectionMatrix();
  }
  resetPosition(respawn=false){
    const x=8,z=7;this.dragon.group.position.set(x,this.world.groundHeightAt(x,z)+2.58,z);
    this.dragon.yaw=-.5;this.dragon.turnAxis=0;this.dragon.speed=0;this.dragon.airborne=false;this.dragon.energy=Math.max(35,this.dragon.energy);
    if(!this.dragon.riding)this.hero.group.position.set(2,this.world.groundHeightAt(2,11,.52),11);
    if(!respawn)this.ui.toast('Posição restaurada ao vilarejo.');
    this.saveGame();
    this.camera.position.set(x+12,this.dragon.group.position.y+12,z+19);
    this._camTarget?.copy(this.dragon.group.position);
  }
  frame(){
    const dt=Math.min(this.clock.getDelta(),.05);this.elapsed+=dt;
    this.world.update(dt,this.elapsed);
    this.landmarks.update(this.elapsed,this.discovery);
    if(this.started){
      const focus=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
      this.dayNight.update(dt,focus);
      const weatherChanged=this.weather.update(dt,this.elapsed,focus,this.dayNight.state.phase);
      if(weatherChanged)this.ui.toast(`Clima mudou: ${this.weather.mode.label}`,4);
    }
    if(this.started){
      if(this.input.consume('t'))this.toggleStable();
      if(this.input.consume('escape')){this.ui.stable.classList.add('hidden');this.ui.hideDialogue();}
      if(this.input.consume('p'))this.saveGame(true);
      if(this.input.consume('c')){this.weather.cycle();this.saveGame();this.ui.toast(`Clima: ${this.weather.mode.label}`,3);}
      if(this.input.consume('g'))this.cycleGraphics();
      if(this.input.consume('v')){this.cameraOrbit.reset();this.ui.toast('Câmera centralizada.');}
      if(this.input.consume('n')){this.dayNight.jumpHours(3);this.saveGame();this.ui.toast(`Hora do mundo: ${this.dayNight.clock}`,3);}
      if(!this.ui.stable.classList.contains('hidden')){
        this.input.clearActions();this.input.down.clear();
        try{this.stablePreview?.render(dt);}catch(error){
          console.warn('Renderização 3D do estábulo indisponível:',error);
          this.stablePreview=null;
          document.getElementById('stable-preview-caption').textContent='Prévia 3D indisponível neste dispositivo; escolha pelos cartões abaixo.';
        }
        return;
      } else {
      if(this.input.consume('e')){if(this.ui.dialogueOpen)this.ui.hideDialogue();else if(!this.interactVillager()&&!this.interactWildDragon())this.mountOrDismount();}
      if(this.input.consume('f'))this.fire();
      if(this.input.consume('r'))this.resetPosition();
      if(this.input.consume('m')){this.audio.muted=!this.audio.muted;this.ui.toast(this.audio.muted?'Áudio desativado':'Áudio ativado');}
      }
      if(this.ui.dialogueOpen)this.input.down.clear();
      this.dragon.setWind(this.weather.mode.wind);
      this.dragon.update(dt,this.input,this.elapsed);
      this.hero.update(dt,this.input,this.elapsed);
      this.missions.update(dt,this.elapsed,this.dragon,text=>this.ui.toast(text));
      this.updateContracts();
      this.updateDiscoveries();
      this.villagers.update(dt,this.elapsed);
      this.wildDragons.update(dt,this.elapsed,this.hero.group.position,this.dragon.riding,this.hero.moveSpeed);
      const trainMsg=this.training.update(dt,this.elapsed,this.dragon);
      if(trainMsg)this.ui.toast(trainMsg,4);
      this.autoSaveTime+=dt;
      if(this.autoSaveTime>15){this.autoSaveTime=0;this.saveGame();}
      this.enemies.update(dt,this.elapsed,this.dragon,(origin,direction)=>this.spawnProjectile(origin,direction,'enemy'));
      this.updateProjectiles(dt);
      this.effects.update(dt);
      this.hurtImmunity=Math.max(0,this.hurtImmunity-dt);
      this.hitFlash=Math.max(0,this.hitFlash-dt);
      this.ui.update(dt,this);
    }else this.dragon.update(dt,{isDown:()=>false},this.elapsed);
    this.updateCamera(dt);
    this.renderer.render(this.scene,this.camera);
    this.fpsTime+=dt;this.frames++;
    if(this.fpsTime>=1){const fps=Math.round(this.frames/this.fpsTime);this.ui.setFPS(fps);
      if(this.graphics.sample(fps)){this.updateGraphicsLabel();this.ui.toast(`Ajuste automático: gráficos ${this.graphics.label}`,3);}
      this.fpsTime=0;this.frames=0;}
  }
}
