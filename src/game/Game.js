import * as THREE from 'three';
import { Input } from './Input.js';
import {CameraOrbit,cameraOffset} from './CameraOrbit.js';
import {resolveCameraPosition} from '../utils/spatialSweep.js';
import {safeDismountSpot} from '../utils/surfaces.js';
import {recoverFreePosition,obstacleBlocks} from '../utils/collision.js';
import { World } from '../world/World.js';
import { Dragon } from '../entities/Dragon.js';
import { EnemySquad } from '../entities/EnemyDragon.js';
import { Hero } from '../entities/Hero.js';
import {HeroAssetUI} from '../ui/HeroAssetUI.js';
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
import {performanceSnapshot,shouldSkipRendering} from '../systems/PerformanceDiagnostics.js';
import {sceneActorStats} from '../systems/ActorLOD.js';
import {projectileLimit} from '../systems/PerformanceBudget.js';
import {projectileAdmission} from '../systems/ProjectilePolicy.js';
import {WildBonds} from '../systems/WildBonds.js';
import {WildDragons} from '../entities/WildDragons.js';

export class Game {
  constructor() {
    this.container=document.getElementById('game');
    const weakGpu=(navigator.deviceMemory>0&&navigator.deviceMemory<=4)||matchMedia('(pointer:coarse)').matches;
    this.renderer=new THREE.WebGLRenderer({antialias:!weakGpu,powerPreference:'high-performance'});
    // GraphicsQuality applies a device-aware resolution cap immediately below.
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.23;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.webglLost=false;this.frameError=null;this.lastKnownFPS=0;this.diagnosticsVisible=false;this.actorStats={visible:0,full:0,limited:0,hidden:0};this.actorViewDirection=new THREE.Vector3();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9bdbef);this.scene.fog=new THREE.FogExp2(0xa3e2ed,.00165);
    this.camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.15,1050);
    this.input=new Input();this.audio=new AudioSystem();this.ui=new UI();
    this.cameraOrbit=new CameraOrbit();this.bindOrbitControls();this.controllerWasConnected=false;
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
    this.heroAssetUI=new HeroAssetUI(this.hero);
    this.enemies=new EnemySquad(this.scene,this.world);
    this.effects=new Effects(this.scene);
    this.applySceneQuality();
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
    this.projectiles=[];this.projectilePool=[];this._projectileFrom=new THREE.Vector3();this._projectileTo=new THREE.Vector3();this.clock=new THREE.Clock();this.started=false;this.elapsed=0;this.fpsTime=0;this.frames=0;
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
    this.renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();this.webglLost=true;
      this.ui.toast('GPU reiniciada: aguardando restaurar gráficos…',5);
    });
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{
      this.webglLost=false;
      // Reconfigure buffers and shadows after a driver/browser GPU restart.
      this.graphics.tier='economy';this.graphics.apply();this.applySceneQuality();this.updateGraphicsLabel();
      this.ui.toast('Gráficos restaurados no modo LEVE. O progresso foi preservado.',6);
    });
    this.renderer.setAnimationLoop(()=>{
      try{if(!this.frameError)this.frame();}
      catch(error){this.handleFrameFailure(error);}
    });
  }
  handleFrameFailure(error){
    if(this.frameError)return;
    this.frameError=error;
    console.error('Erro na atualização do jogo:',error);
    try{this.saveGame();}catch{}
    // Keep the error visible instead of a frozen frame without explanation.
    const fatal=document.getElementById('fatal');
    fatal.classList.remove('hidden');
    fatal.replaceChildren();
    const title=document.createElement('h2');title.textContent='O jogo encontrou um erro';fatal.append(title);
    const message=document.createElement('p');message.textContent='Seu progresso foi salvo quando possível. Recarregue a página para tentar continuar.';fatal.append(message);
    const details=document.createElement('pre');details.textContent=String(error?.stack??error);fatal.append(details);
    const retry=document.createElement('button');retry.textContent='Recarregar jogo';
    retry.addEventListener('click',()=>window.location.reload());fatal.append(retry);
  }
  toggleDiagnostics(){
    this.diagnosticsVisible=!this.diagnosticsVisible;
    document.getElementById('performance-panel')?.classList.toggle('hidden',!this.diagnosticsVisible);
  }
  renderDiagnostics(fps){
    if(!this.diagnosticsVisible)return;
    let active=0;
    for(const bucket of Object.values(this.effects.buckets))active+=bucket.particles.length;
    document.getElementById('performance-panel').textContent=performanceSnapshot({
      fps,renderer:this.renderer,projectiles:this.projectiles.length,effects:active,
      tier:this.graphics.tier,mounted:this.dragon.riding,
      visibleIslands:this.world.visibleIslandCount,totalIslands:5,
      actorsVisible:this.actorStats.visible,actorsLimited:this.actorStats.limited,
      actorsProxied:this.actorStats.proxied??0});
  }
  updateActorDetail(){
    const observer=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
    const camera=this.camera.position;
    const forward=this.camera.getWorldDirection(this.actorViewDirection);
    const tier=this.graphics.tier;
    this.wildDragons.setDetail(observer,tier,camera,forward);
    this.enemies.setDetail(observer,tier,camera,forward);
    this.villagers.setDetail(observer,tier,camera,forward);
    const levels=[...this.wildDragons.creatures.map(c=>c.visualLevel),
      ...this.enemies.enemies.filter(e=>e.active&&e.alive).map(e=>e.visualLevel),
      ...this.villagers.npcs.map(n=>n.root.visible?'full':'hidden')];
    this.actorStats=sceneActorStats(levels);
    this.actorStats.proxied=this.wildDragons.creatures.filter(c=>c.lowDetail.visible&&c.group.visible).length+
      this.enemies.enemies.filter(e=>e.proxy.visible&&e.group.visible).length;
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
      this.input.down.clear();this.input.clearActions();
      document.getElementById('stable-close')?.focus();}
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
    const dragonY=Math.max(p.y,this.world.groundHeightAt(p.x,p.z,1.65)+2.58);
    const dragonSpot=recoverFreePosition({x:p.x,z:p.z},1.65,this.world.obstacles,
      (x,z)=>p.airborne||this.world.walkable(x,z),
      o=>obstacleBlocks(o,dragonY,1.65),
      {groundAt:(x,z)=>this.world.groundHeightAt(x,z,1.65),maxHeightDelta:p.airborne?Infinity:2.2});
    const dragonX=dragonSpot?.x??p.x,dragonZ=dragonSpot?.z??p.z;
    this.dragon.group.position.set(dragonX,Math.max(p.y,this.world.groundHeightAt(dragonX,dragonZ,1.65)+2.58),dragonZ);
    this.dragon.yaw=p.yaw;this.dragon.group.rotation.y=p.yaw;
    this.dragon.airborne=p.mounted&&p.airborne;this.dragon.energy=Math.min(this.progression.stats.maxEnergy,p.energy);
    const safeHero=recoverFreePosition({x:p.heroX,z:p.heroZ},.52,this.world.obstacles,
      (x,z)=>this.world.walkable(x,z),o=>obstacleBlocks(o,this.world.groundHeightAt(p.heroX,p.heroZ,.52)+1.1,1.1),
      {groundAt:(x,z)=>this.world.groundHeightAt(x,z,.52)});
    const heroX=safeHero?.x??p.heroX,heroZ=safeHero?.z??p.heroZ;
    this.hero.group.position.set(heroX,this.world.groundHeightAt(heroX,heroZ,.52),heroZ);
    if(p.mounted){this.dragon.mount();this.hero.setMounted(true);}
    this.health=p.health;
  }
  applySceneQuality(){
    const tier=this.graphics.tier;
    this.effects?.setQuality(tier);this.weather?.setQuality(tier);this.world?.setDetailQuality(tier);
    if(this.world?.sun){this.world.sun.castShadow=tier!=='economy';}
    // Shadows are fully disabled in economy. Never change map size on each shot.
  }
  updateGraphicsLabel(){document.getElementById('quality-toggle').textContent=`GRÁFICOS: ${this.graphics.label} · G`;}
  cycleGraphics(){this.graphics.cycle();this.applySceneQuality();this.updateGraphicsLabel();this.ui.toast(`Qualidade: ${this.graphics.label}`,3);}
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
  getProjectile(owner){
    const mesh=this.projectilePool.pop()??new THREE.Mesh(this.projectileGeometry,this.projectileMaterials[owner]);
    mesh.material=this.projectileMaterials[owner];mesh.visible=true;
    return mesh;
  }
  recycleProjectileAt(index){
    const bullet=this.projectiles[index];
    this.scene.remove(bullet.mesh);
    this.projectilePool.push(bullet.mesh);
    this.projectiles.splice(index,1);
  }
  spawnProjectile(origin,direction,owner){
    const cap=projectileLimit(this.graphics.tier);
    const admission=projectileAdmission(this.projectiles,owner,cap);
    if(!admission.allowed)return false;
    if(admission.evictIndex>=0)this.recycleProjectileAt(admission.evictIndex);
    const mesh=this.getProjectile(owner);
    mesh.position.copy(origin);mesh.scale.setScalar(owner==='enemy'?1.9:1.5);
    this.scene.add(mesh);
    const speed=owner==='enemy'?56:95;
    this.projectiles.push({mesh,velocity:direction.clone().multiplyScalar(speed),life:owner==='enemy'?3.2:2.4,owner});
    this.audio.play(owner==='enemy'?'enemyFire':'fire');
    return true;
  }
  fire(){
    if(!this.dragon.riding){this.ui.toast('Monte no seu dragão primeiro.');return;}
    if(this.missions.stage<3){this.ui.toast('Fogo bloqueado: complete a missão das runas.');return;}
    if(this.dragon.fireCooldown>0)return;
    const stats=this.progression.stats;
    if(this.dragon.energy<stats.fireCost){this.ui.toast('Energia insuficiente para lançar fogo.');return;}
    // Only spend stamina when an actual projectile can be scheduled.
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
    if(this.spawnProjectile(start,direction,'player')){
      this.dragon.fireCooldown=stats.fireCooldown;this.dragon.energy-=stats.fireCost;
      this.effects.burst(start,'fire',7);
    }
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
    while(this.projectiles.length)this.recycleProjectileAt(this.projectiles.length-1);
  }
  updateProjectiles(dt){
    for(let i=this.projectiles.length-1;i>=0;i--){
      const bullet=this.projectiles[i];bullet.life-=dt;
      const from=this._projectileFrom.copy(bullet.mesh.position);
      const to=this._projectileTo.copy(from).addScaledVector(bullet.velocity,dt);
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
      if(hit||bullet.life<=0||to.y<-.9)this.recycleProjectileAt(i);
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
    // Resolve from the actor toward the smoothed camera: endpoint-only terrain
    // checks used to let the viewpoint fly through monuments and houses.
    const followTarget=this.camera.position.clone().lerp(camPos,smoothFollow(riding?3.1:5,dt));
    const cameraAnchor={x:focus.x,y:focus.y+(riding?3.6:2.7),z:focus.z};
    const safeCamera=resolveCameraPosition(cameraAnchor,followTarget,this.world.obstacles,
      (x,z)=>this.world.heightAt(x,z),{radius:.45,groundClearance:1.1});
    this.camera.position.set(safeCamera.x,safeCamera.y,safeCamera.z);
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
  navigateStable(direction){
    const root=document.getElementById('stable');
    const buttons=Array.from(root.querySelectorAll('button:not(:disabled)')).filter(b=>b.offsetParent!==null);
    if(!buttons.length)return;
    const current=buttons.indexOf(document.activeElement);
    const next=(current+direction+buttons.length)%buttons.length;
    buttons[next].focus();
  }
  frame(){
    const realDt=this.clock.getDelta();
    if(shouldSkipRendering({hidden:document.hidden,webglLost:this.webglLost})){
      this.fpsTime=0;this.frames=0;this.input.clearActions();return;
    }
    const dt=Math.min(realDt,.05);this.elapsed+=dt;
    this.input.update();
    const controllerConnected=this.input.pad.connected;
    if(controllerConnected!==this.controllerWasConnected){
      this.controllerWasConnected=controllerConnected;
      const status=document.getElementById('controller-status');
      if(status){status.textContent=controllerConnected?'🎮 CONTROLE CONECTADO':'TECLADO / TOQUE';status.classList.toggle('connected',controllerConnected);}
      if(controllerConnected&&this.started)this.ui.toast('Controle detectado: analógico esquerdo move, direito controla a câmera.',4);
    }
    if(this.input.lookAxis && this.started && this.ui.stable.classList.contains('hidden') && !this.ui.dialogueOpen){
      const look=this.input.lookAxis;
      if(Math.abs(look.x)>.001||Math.abs(look.y)>.001)this.cameraOrbit.drag(look.x*210*dt,look.y*150*dt);
    }
    if(!this.started && (this.input.consume('start')||this.input.consume('e'))){this.start();}

    this.world.update(dt,this.elapsed);
    this.landmarks.update(this.elapsed,this.discovery);
    if(this.started){
      const focus=this.dragon.riding?this.dragon.group.position:this.hero.group.position;
      this.dayNight.update(dt,focus);
      const weatherChanged=this.weather.update(dt,this.elapsed,focus,this.dayNight.state.phase);
      if(weatherChanged)this.ui.toast(`Clima mudou: ${this.weather.mode.label}`,4);
    }
    if(this.started){
      if(this.input.consume('t')||this.input.consume('start'))this.toggleStable();
      if(this.input.consume('escape')){this.ui.stable.classList.add('hidden');this.ui.hideDialogue();}
      if(this.input.consume('p'))this.saveGame(true);
      if(this.input.consume('c')){this.weather.cycle();this.saveGame();this.ui.toast(`Clima: ${this.weather.mode.label}`,3);}
      if(this.input.consume('g'))this.cycleGraphics();
      if(this.input.consume('f3'))this.toggleDiagnostics();
      if(this.input.consume('v')){this.cameraOrbit.reset();this.ui.toast('Câmera centralizada.');}
      if(this.input.consume('n')){this.dayNight.jumpHours(3);this.saveGame();this.ui.toast(`Hora do mundo: ${this.dayNight.clock}`,3);}
      if(!this.ui.stable.classList.contains('hidden')){
        if(this.input.consume('menuup')||this.input.consume('menuleft'))this.navigateStable(-1);
        if(this.input.consume('menudown')||this.input.consume('menuright'))this.navigateStable(1);
        if(this.input.consume('e')&&this.input.pad.connected){const active=document.activeElement; if(active?.tagName==='BUTTON'&&this.ui.stable.contains(active))active.click();}
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
    this.updateActorDetail();
    this.world.updateDetail(this.camera.position,dt);
    this.renderer.render(this.scene,this.camera);
    this.fpsTime+=realDt;this.frames++;
    if(this.fpsTime>=1){const fps=Math.round(this.frames/this.fpsTime);this.lastKnownFPS=fps;this.ui.setFPS(fps);this.renderDiagnostics(fps);
      if(this.started && !document.hidden && this.graphics.sample(fps)){this.applySceneQuality();this.updateGraphicsLabel();this.ui.toast(`Ajuste automático: gráficos ${this.graphics.label}`,3);}
      this.fpsTime=0;this.frames=0;}
  }
}
