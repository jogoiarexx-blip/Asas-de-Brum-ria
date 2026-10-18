import * as THREE from 'three';
import {BOAT_POSITIONS,GIANT_DRAGON_POSITION} from '../systems/ExpeditionRules.js';

// This entire module is dynamically imported ONLY while flying toward the gate.
// Its scene resources and collision volumes are released when leaving the zone.
export class MountainRegion {
  constructor(scene,world,progress){
    this.scene=scene;this.world=world;this.progress=progress;
    this.root=new THREE.Group();this.root.name='MAPA_MONTANHAS_SOMBRA';scene.add(this.root);
    this.obstacles=[];this.boats=[];this.boatSails=[];this.boatObstacles=[];this.boss=null;this.elapsed=0;this.attackClock=0;
    this.buildTerrain();this.buildShips();this.buildBoss();this.refresh();
    world.obstacles.push(...this.obstacles);
  }
  heightAt(x,z){
    const dx=x-1042,dz=z-3,d=Math.hypot(dx,dz);
    if(d>=176)return -2;
    const band=Math.max(0,1-d*d/(176*176));
    const summit=48*Math.exp(-((x-1083)**2+(z+33)**2)/(65*65));
    const west=37*Math.exp(-((x-983)**2+(z-57)**2)/(43*43));
    const ridge=25*Math.exp(-((x-1127)**2+(z-73)**2)/(56*56));
    return -2+Math.pow(band,1.45)*(10+summit+west+ridge);
  }
  buildTerrain(){
    const steps=64,rings=18,positions=[],colors=[],indices=[];
    const low=new THREE.Color(0x36565a),mid=new THREE.Color(0x69736d),snow=new THREE.Color(0xd5dee6);
    for(let ring=0;ring<=rings;ring++){
      const radius=176*ring/rings;
      for(let k=0;k<=steps;k++){
        const a=2*Math.PI*k/steps,x=1042+Math.cos(a)*radius,z=3+Math.sin(a)*radius;
        const y=this.heightAt(x,z);
        positions.push(x,y,z);
        const color=y>36?snow:y>18?mid:low;
        colors.push(color.r,color.g,color.b);
        if(ring&&k){const i=ring*(steps+1)+k;indices.push(i,i-1,i-steps-1,i-1,i-steps-2,i-steps-1);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
    const landscape=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
    landscape.receiveShadow=true;this.root.add(landscape);
    const water=new THREE.Mesh(new THREE.PlaneGeometry(730,700),new THREE.MeshLambertMaterial({color:0x1f7788,transparent:true,opacity:.87,depthWrite:false}));
    water.rotation.x=-Math.PI/2;water.position.set(1030,-2.15,0);this.root.add(water);
    // Few angular cliffs, not hundreds of imported textures/meshes.
    const stone=new THREE.MeshLambertMaterial({color:0x59626c,flatShading:true});
    // One GPU draw call for all decorative rocks, instead of one draw call
    // and one geometry allocation per cliff. Physics uses the same colliders.
    const rocks=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),stone,14);
    const dummy=new THREE.Object3D();let used=0;
    for(let i=0;i<14;i++){
      const a=i*2.4,r=35+(i*17)%113,x=1042+Math.cos(a)*r,z=3+Math.sin(a)*r;
      const h=this.heightAt(x,z);if(h<2)continue;
      const radius=4+i%4,peak=7+i%6*3;
      dummy.position.set(x,h+peak*.3,z);
      dummy.rotation.y=a;
      dummy.scale.set(radius,peak,radius);
      dummy.updateMatrix();rocks.setMatrixAt(used++,dummy.matrix);
      this.obstacles.push({x,z,radius:radius*.8,bottom:h,top:h+peak,type:'mountain-rock'});
    }
    rocks.count=used;rocks.castShadow=false;rocks.instanceMatrix.needsUpdate=true;
    this.root.add(rocks);this.rocksMesh=rocks;
    const beacon=new THREE.Mesh(new THREE.TorusGeometry(9,.55,8,36),new THREE.MeshBasicMaterial({color:0x8bf2e9}));
    beacon.position.set(806,55,35);beacon.rotation.y=Math.PI/2;this.root.add(beacon);this.entryBeacon=beacon;
  }
  buildShips(){
    const hullMat=new THREE.MeshLambertMaterial({color:0x5d3b32});
    const sailMat=new THREE.MeshLambertMaterial({color:0xa13f3d,side:THREE.DoubleSide});
    const wood=new THREE.MeshLambertMaterial({color:0xb38b62});
    for(let i=0;i<BOAT_POSITIONS.length;i++){
      const [x,y,z]=BOAT_POSITIONS[i],group=new THREE.Group();group.position.set(x,y,z);
      const hull=new THREE.Mesh(new THREE.CylinderGeometry(2.9,4.5,16,8,1),hullMat);
      hull.rotation.z=Math.PI/2;hull.scale.set(.55,1,.74);group.add(hull);
      const deck=new THREE.Mesh(new THREE.BoxGeometry(14,1.1,5.4),wood);deck.position.y=1;group.add(deck);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.25,.32,16,7),wood);mast.position.y=9;group.add(mast);
      const sail=new THREE.Mesh(new THREE.PlaneGeometry(9,11),sailMat);sail.position.set(0,10,0);sail.rotation.y=Math.PI/2;group.add(sail);
      const banner=new THREE.Mesh(new THREE.ConeGeometry(1.5,3,5),new THREE.MeshBasicMaterial({color:0xf4c084}));banner.position.set(-4,2,0);group.add(banner);
      group.rotation.y=.4+i*1.18;this.root.add(group);this.boats.push(group);this.boatSails.push(sail);
      const obstacle={x,z,radius:7,bottom:2,top:17,type:'enemy-ship',shape:'box',halfWidth:7,halfDepth:3.8,angle:group.rotation.y};
      this.obstacles.push(obstacle);this.boatObstacles.push(obstacle);
    }
  }
  buildBoss(){
    const group=new THREE.Group();group.position.set(GIANT_DRAGON_POSITION.x,GIANT_DRAGON_POSITION.y,GIANT_DRAGON_POSITION.z);
    const scales=new THREE.MeshStandardMaterial({color:0x402744,metalness:.12,roughness:.75,flatShading:true});
    const wingMat=new THREE.MeshLambertMaterial({color:0x8a3969,side:THREE.DoubleSide});
    const gold=new THREE.MeshBasicMaterial({color:0xf9a848});
    const body=new THREE.Mesh(new THREE.IcosahedronGeometry(12,1),scales);body.scale.set(1.5,.8,2.2);group.add(body);
    const head=new THREE.Mesh(new THREE.IcosahedronGeometry(6,1),scales);head.position.set(0,4,-19);group.add(head);
    const jaw=new THREE.Mesh(new THREE.ConeGeometry(3,10,6),scales);jaw.position.set(0,2,-25);jaw.rotation.x=-Math.PI/2;group.add(jaw);
    const eyeGeo=new THREE.SphereGeometry(1.2,7,6);
    for(const side of [-1,1]){
      const eye=new THREE.Mesh(eyeGeo,gold);eye.position.set(side*4,6,-22);group.add(eye);
      const horn=new THREE.Mesh(new THREE.ConeGeometry(2,9,5),scales);horn.position.set(side*3,10,-17);horn.rotation.z=-side*.25;group.add(horn);
    }
    this.wings=[];
    for(const side of [-1,1]){
      const pivot=new THREE.Group();pivot.position.set(side*9,5,0);group.add(pivot);
      const mesh=new THREE.Mesh(new THREE.ConeGeometry(11,32,3),wingMat);
      mesh.rotation.z=side*.9;mesh.position.set(side*14,1,0);pivot.add(mesh);this.wings.push({pivot,side});
    }
    const tail=new THREE.Mesh(new THREE.ConeGeometry(4,27,6),scales);tail.rotation.x=Math.PI/2;tail.position.z=20;group.add(tail);
    const crown=new THREE.Mesh(new THREE.TorusGeometry(14,.45,7,32),gold);crown.rotation.x=Math.PI/2;group.add(crown);
    const warningMaterial=new THREE.MeshBasicMaterial({color:0xff5c33,transparent:true,opacity:.86,depthWrite:false});
    const warning=new THREE.Mesh(new THREE.TorusGeometry(20,.65,6,48),warningMaterial);
    warning.rotation.x=Math.PI/2;warning.position.y=17;warning.visible=false;group.add(warning);
    this.bossWarningRing=warning;
    this.root.add(group);this.boss=group;
  }
  refresh(){
    this.boats.forEach((boat,i)=>{
      const health=this.progress.boatHealth[i];
      const exists=health>0;boat.visible=exists;
      // Sails visibly tear after the first hit, instead of looking untouched.
      this.boatSails[i].scale.set(health===1?.77:1,health===1?.78:1,1);
      const hull=this.boatObstacles[i];if(hull){hull.top=exists?17:2;hull.bottom=exists?2:2;}
    });
    this.boss.visible=this.progress.phase==='boss';
  }
  setBossWarning(active){
    if(this.bossWarningRing)this.bossWarningRing.visible=Boolean(active)&&this.boss.visible;
  }
  update(dt,time){
    this.elapsed+=dt;
    this.boats.forEach((boat,i)=>{if(boat.visible)boat.position.y=BOAT_POSITIONS[i][1]+Math.sin(time*1.7+i)*.5;});
    if(this.boss.visible){
      this.boss.position.x=GIANT_DRAGON_POSITION.x+Math.sin(time*.35)*13;
      this.boss.position.y=GIANT_DRAGON_POSITION.y+Math.cos(time*.7)*4;
      for(const {pivot,side} of this.wings)pivot.rotation.z=side*(.25+Math.sin(time*2)*.25);
      if(this.bossWarningRing.visible)this.bossWarningRing.rotation.z+=dt*2.5;
    }
  }
  unload(){
    // Hulls, sails and rocks share GPU resources: dispose each unique object once.
    const disposed=new Set();
    const release=resource=>{if(resource&&!disposed.has(resource)){
      disposed.add(resource);resource.dispose();
    }};
    this.root.traverse(obj=>{
      release(obj.geometry);
      if(obj.material){for(const material of (Array.isArray(obj.material)?obj.material:[obj.material]))release(material);}
    });
    this.root.parent?.remove(this.root);
    const set=new Set(this.obstacles);this.world.obstacles=this.world.obstacles.filter(item=>!set.has(item));
    if(this.world.mountainRegion===this)this.world.mountainRegion=null;
  }
}
