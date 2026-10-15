import * as THREE from 'three';
import { ISLANDS } from './config.js';
import { seededRandom, clamp } from '../utils/math.js';
import { obstacleCeiling } from '../utils/collision.js';
import { surfaceHeightAt } from '../utils/surfaces.js';
const brown = new THREE.MeshLambertMaterial({color:0x855b37});
const leafPalette = [0x245d49,0x2b7355,0x398565,0x31735c];
const rand = seededRandom(18971);

export class World {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.clouds = [];
    this.materials = [];
    this.obstacles = [];this.surfaces=[];
    this.forestTrees = [];this.forestRocks = [];this.foliageMeshes = [];
    this.cloudWind=1;
    this.populate();
  }
  islandHeight(island,x,z) {
    const dx = x-island.x, dz = z-island.z;
    const d = Math.hypot(dx,dz)/island.r;
    if (d>=1) return -2;
    const rough = Math.sin(x*.13 + island.seed)*Math.cos(z*.16-island.seed)*.85;
    const wave = Math.sin(x*.055 + island.seed)*Math.cos(z*.07)*1.4;
    return -1.5 + island.h*Math.pow(Math.max(0,1-d*d),1.7) + (rough+wave)*(1-d);
  }
  heightAt(x,z) {
    let h = -2;
    for (const island of ISLANDS) h=Math.max(h,this.islandHeight(island,x,z));
    return h;
  }
  groundHeightAt(x,z) { return surfaceHeightAt(this.heightAt(x,z),x,z,this.surfaces); }
  walkable(x,z) { return ISLANDS.some(i=>Math.hypot(x-i.x,z-i.z) < i.r*.92 && this.islandHeight(i,x,z)>1); }
  clearanceAt(x,z,radius=1) { return obstacleCeiling(x,z,radius,this.obstacles); }
  addObstacle(x,y,z,radius,height,type){
    this.obstacles.push({x,z,radius,bottom:y,top:y+height,type});
  }
  populate() {
    const scene = this.scene;
    const sky = new THREE.HemisphereLight(0xd6f4ff,0x3a6d65,2.25); scene.add(sky);this.sky=sky;
    const sun = new THREE.DirectionalLight(0xffedcb,2.65); sun.position.set(-135,190,-200);
    sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-140;sun.shadow.camera.right=140; sun.shadow.camera.top=140; sun.shadow.camera.bottom=-140;
    sun.shadow.camera.near=1; sun.shadow.camera.far=500; sun.shadow.bias=-.001; scene.add(sun);scene.add(sun.target);this.sun=sun;
    const sunOrb = new THREE.Mesh(new THREE.SphereGeometry(29,20,16),new THREE.MeshBasicMaterial({color:0xffefd0,fog:false}));
    sunOrb.position.set(-400,270,-520); scene.add(sunOrb);this.sunOrb=sunOrb;
    const waterTexture = this.makeWaterTexture();
    this.waterTexture=waterTexture;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),new THREE.MeshPhongMaterial({color:0x2b9ab9,shininess:100,specular:0x86d8ee,map:waterTexture,transparent:true,opacity:.95}));
    water.rotation.x=-Math.PI/2; water.position.y=-.9; water.receiveShadow=true;scene.add(water);
    for (const island of ISLANDS) this.buildIsland(island);
    this.flushFoliage();
    this.buildCoastalDetails(); this.buildWildGrass(); this.buildVillage(); this.buildVillageProps(); this.buildClouds(); this.buildSeabirds();
  }
  makeWaterTexture() {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#62b6c9';ctx.fillRect(0,0,256,256);
    for (let i=0;i<130;i++) { const x=rand()*256, y=rand()*256;
      ctx.strokeStyle=`rgba(214,254,250,${.07+rand()*.18})`;
      ctx.lineWidth=1+rand()*1.8;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+7,y-3,x+18+rand()*20,y);ctx.stroke(); }
    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  buildIsland(island) {
    const N=84,R=27,pos=[],colors=[],indices=[];
    const sand=new THREE.Color(0xbcb584), grass=new THREE.Color(0x477f53), high=new THREE.Color(0x648a65), rock=new THREE.Color(0x657b70);
    for(let ring=0;ring<=R;ring++) {
      const rr=ring/R*island.r;
      for(let j=0;j<=N;j++){
        const a=j/N*Math.PI*2,x=island.x+Math.cos(a)*rr,z=island.z+Math.sin(a)*rr;
        const y=this.islandHeight(island,x,z);
        pos.push(x,y,z);
        const c = y<2?sand.clone():y<12?grass.clone():high.clone().lerp(rock,clamp((y-18)/14,0,.75));
        const tint=(Math.sin(x*.15)*Math.cos(z*.1)+1)*.045;
        c.offsetHSL(0,0,tint-.045);colors.push(c.r,c.g,c.b);
      }
    }
    for(let ring=0;ring<R;ring++)for(let j=0;j<N;j++){
      const a=ring*(N+1)+j,b=a+N+1;indices.push(a,a+1,b,a+1,b+1,b);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));mesh.receiveShadow=true;sceneAdd(this.scene,mesh);
    const amount=island.r>75?89:35;
    for(let i=0;i<amount;i++) {
      const a=rand()*Math.PI*2,d=Math.sqrt(rand())*island.r*.8;
      const x=island.x+Math.cos(a)*d,z=island.z+Math.sin(a)*d;
      if(island.name==='Ilha do Refúgio' && x>-22 && x<32 && z>-28 && z<34) continue;
      const y=this.heightAt(x,z);if(y<3)continue;
      if(rand()<.76)this.addTree(x,y,z,.7+rand()*1.25);
      else this.addRock(x,y,z,.8+rand()*1.5);
    }
    for(let i=0;i<24;i++) {
      const a=rand()*Math.PI*2,d=island.r*(.84+rand()*.13),x=island.x+Math.cos(a)*d,z=island.z+Math.sin(a)*d;
      this.addRock(x,this.heightAt(x,z),z,.6+rand()*1.3);
    }
  }
  // Faixas de espuma e reflexos ao redor das cinco costas, sem mapas de textura externos.
  buildCoastalDetails() {
    const foamMat=new THREE.MeshBasicMaterial({color:0xe2f9eb,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
    const waveMat=new THREE.MeshBasicMaterial({color:0x96e9e5,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide});
    for(const island of ISLANDS)for(let band=0;band<2;band++) {
      const positions=[],uv=[],indices=[],steps=144;
      const r0=island.r*(band===0?.935:.965);
      const r1=r0+(band===0?2.1:1.0);
      for(let i=0;i<=steps;i++) {
        const t=i/steps,a=t*Math.PI*2;
        const wobble=Math.sin(a*17+island.seed)*.22+Math.sin(a*31-island.seed)*.14;
        for(const dr of [r0,r1]) {
          const r=dr+wobble;
          positions.push(island.x+Math.cos(a)*r,-.70+band*.012,island.z+Math.sin(a)*r);
          uv.push(t,dr===r0?0:1);
        }
        if(i<steps){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      this.scene.add(new THREE.Mesh(geometry,band===0?foamMat:waveMat));
    }
  }
  // Instância centenas de tufos sem centenas de draw calls.
  buildWildGrass() {
    const geometry=new THREE.ConeGeometry(.21,.85,3);
    const material=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
    const dummy=new THREE.Object3D();
    for(const island of ISLANDS) {
      const count=island.r>70?220:115;
      const mesh=new THREE.InstancedMesh(geometry,material,count);
      const palette=island.name==='Ilha da Névoa'?[0x669c9a,0x86a79a,0x4a887e]:
        island.name==='Atol Esquecido'?[0xb7af62,0xc4be81,0x819d5b]:[0x68a977,0x91b76f,0x447f67];
      let placed=0;
      for(let attempts=0;attempts<count*5&&placed<count;attempts++){
        const a=rand()*Math.PI*2,d=Math.sqrt(rand())*island.r*.83;
        const x=island.x+Math.cos(a)*d,z=island.z+Math.sin(a)*d;
        if(island.name==='Ilha do Refúgio'&&x>-37&&x<34&&z>-32&&z<38)continue;
        const y=this.heightAt(x,z);if(y<2||y>24)continue;
        dummy.position.set(x,y+.39,z);dummy.rotation.y=rand()*Math.PI*2;
        const scale=.55+rand()*1.7;dummy.scale.set(scale,scale*(.7+rand()*.8),scale);dummy.updateMatrix();
        mesh.setMatrixAt(placed,dummy.matrix);
        mesh.setColorAt(placed,new THREE.Color(palette[Math.floor(rand()*palette.length)]));
        placed++;
      }
      mesh.count=placed;mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      this.scene.add(mesh);
    }
  }
  buildVillageProps() {
    const timber=new THREE.MeshStandardMaterial({color:0x826248,roughness:.95});
    const gold=new THREE.MeshStandardMaterial({color:0xe2b86e,roughness:.55,metalness:.18});
    // Caixas de provisões, degraus para o estábulo e balizas de orientação.
    const crateLocations=[[-5,14],[16,14],[-25,18],[16,-15]];
    for(const [x,z] of crateLocations) {
      const y=this.heightAt(x,z);
      const box=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.3,1.35),timber);
      box.position.set(x,y+.65,z);box.rotation.y=x*.1;box.castShadow=true;this.scene.add(box);
      const rim=new THREE.Mesh(new THREE.BoxGeometry(1.41,.15,1.41),gold);
      rim.position.set(x,y+1.25,z);rim.rotation.y=x*.1;this.scene.add(rim);
      this.addObstacle(x,y,z,1.04,1.35,'crate');
    }
    const guides=[[6,16],[12,17],[18,6],[-2,13]];
    for(const [x,z] of guides) {
      const y=this.heightAt(x,z);
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,3.4,6),timber);
      post.position.set(x,y+1.7,z);post.castShadow=true;this.scene.add(post);
      const lamp=new THREE.Mesh(new THREE.OctahedronGeometry(.46),new THREE.MeshStandardMaterial({color:0xffce78,emissive:0xff9e42,emissiveIntensity:.9}));
      lamp.position.set(x,y+3.43,z);this.scene.add(lamp);
      this.addObstacle(x,y,z,.33,3.55,'post');
    }
  }
  // Batch static vegetation into five draw groups instead of thousands of scene meshes.
  // The collision volumes remain identical to the procedural v0.7 terrain.
  addTree(x,y,z,size=1) {
    this.forestTrees.push({x,y,z,size,palette:Math.floor(rand()*leafPalette.length)});
    this.addObstacle(x,y,z,.82*size,5.2*size,'tree');
  }
  addRock(x,y,z,size) {
    this.forestRocks.push({x,y,z,size,palette:rand()>.5?0x829087:0x6c807a,rotation:rand()*6});
    this.addObstacle(x,y,z,1.18*size,1.2*size,'rock');
  }
  flushFoliage() {
    const dummy=new THREE.Object3D();
    const trees=this.forestTrees,rocks=this.forestRocks;
    const addBatch=(geometry,material,items,place,colorOf,shadows=false)=>{
      if(!items.length)return;
      const batch=new THREE.InstancedMesh(geometry,material,items.length);
      batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      for(let i=0;i<items.length;i++){
        const item=items[i];dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);
        place(item,dummy);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
        if(colorOf)batch.setColorAt(i,new THREE.Color(colorOf(item)));
      }
      batch.instanceMatrix.needsUpdate=true;
      if(batch.instanceColor)batch.instanceColor.needsUpdate=true;
      batch.castShadow=shadows;batch.computeBoundingSphere();
      this.scene.add(batch);this.foliageMeshes.push(batch);
    };
    addBatch(new THREE.CylinderGeometry(.2,.38,2.4,6),brown,trees,
      (t,d)=>{d.position.set(t.x,t.y+1.2*t.size,t.z);d.scale.setScalar(t.size);},null,true);
    const crownMaterial=new THREE.MeshLambertMaterial({color:0xffffff});
    for(let k=0;k<3;k++)addBatch(new THREE.ConeGeometry(1.65-k*.22,3.2-k*.4,7),crownMaterial,trees,
      (t,d)=>{d.position.set(t.x,t.y+(3.1+k*.85)*t.size,t.z);d.scale.setScalar(t.size);},
      t=>leafPalette[t.palette],k===0);
    addBatch(new THREE.DodecahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),rocks,
      (r,d)=>{d.position.set(r.x,r.y+r.size*.45,r.z);d.rotation.y=r.rotation;d.scale.set(1.35*r.size,.67*r.size,.95*r.size);},
      r=>r.palette,true);
  }
  buildVillage() {
    const cabin=(x,z,size=1)=>{
      const group=new THREE.Group();const y=this.heightAt(x,z);group.position.set(x,y,z);group.scale.setScalar(size);
      const wood=new THREE.MeshLambertMaterial({color:0x9f7652}), roof=new THREE.MeshLambertMaterial({color:0x354c54});
      const base=new THREE.Mesh(new THREE.BoxGeometry(6,4.5,5),wood);base.position.y=2.35;base.castShadow=true;group.add(base);
      const top=new THREE.Mesh(new THREE.ConeGeometry(5.3,3.6,4),roof);top.position.y=5.6;top.rotation.y=Math.PI/4;top.castShadow=true;group.add(top);
      const door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.7,.08),new THREE.MeshLambertMaterial({color:0x513729}));door.position.set(0,1.35,2.54);group.add(door);
      this.scene.add(group);
      this.addObstacle(x,y,z,3.65*size,7.6*size,'cabin');
    };
    cabin(-12,-14,1);cabin(-22,9,.8);cabin(21,-23,1.13);cabin(-32,-17,.76);
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(7.2,7.9,.75,10),new THREE.MeshLambertMaterial({color:0x9d7c5c}));
    platform.position.set(8,this.heightAt(8,7)+.17,7);platform.receiveShadow=true;this.scene.add(platform);
    this.surfaces.push({x:8,z:7,radius:7.15,top:platform.position.y+.375});
    const fire=new THREE.Group();fire.position.set(-3,this.heightAt(-3,0),0);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.65,0),new THREE.MeshLambertMaterial({color:0x777a6f}));stone.position.set(Math.cos(a)*2.1,.3,Math.sin(a)*2.1);fire.add(stone);
    }
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.9,2.3,6),new THREE.MeshBasicMaterial({color:0xff9939}));flame.position.y=1.2;fire.add(flame);
    const light=new THREE.PointLight(0xffad60,25,23,2);light.position.y=3;fire.add(light);this.fire=flame;this.scene.add(fire);
    this.addObstacle(-3,fire.position.y,0,2.2,2.8,'fire');
    const banner=new THREE.Group();banner.position.set(13,this.heightAt(13,-9),-9);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,9,6),brown);pole.position.y=4.5;banner.add(pole);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshLambertMaterial({color:0xf0ca79,side:THREE.DoubleSide}));flag.position.set(2,7.4,0);banner.add(flag);this.scene.add(banner);
  }
  buildClouds() {
    const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.62,depthWrite:false,fog:true});
    for(let i=0;i<25;i++){
      const group=new THREE.Group();group.position.set((rand()-.5)*850,85+rand()*78,(rand()-.5)*850);
      const scale=1.8+rand()*2.8;
      for(let j=0;j<5;j++) {
        const puff=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),material);
        puff.position.set((j-2)*2.0,(rand()-.5)*.8,(rand()-.5)*2);
        puff.scale.set(2.5+rand(),1.15+rand()*.65,1.6+rand());group.add(puff);
      }
      group.scale.setScalar(scale);group.userData.drift=.8+rand()*1.6;
      this.clouds.push(group);this.scene.add(group);
    }
  }
  buildSeabirds() {
    const mat=new THREE.MeshBasicMaterial({color:0xe3faf9,side:THREE.DoubleSide});this.birds=[];
    for(let i=0;i<12;i++) {
      const bird=new THREE.Group();bird.position.set((rand()-.5)*250,38+rand()*28,(rand()-.5)*230);
      for(const side of [-1,1]){
        const wing=new THREE.Mesh(new THREE.ConeGeometry(.25,2.5,3),mat);
        wing.position.x=side*.95;wing.rotation.z=side*Math.PI/2;bird.add(wing);
      }
      bird.userData={offset:rand()*6.2,speed:2+rand()*2,centerX:bird.position.x,centerZ:bird.position.z};this.scene.add(bird);this.birds.push(bird);
    }
  }
  update(dt,time) {
    this.elapsed=time;this.waterTexture.offset.x=(time*.004)%1;this.waterTexture.offset.y=(time*.003)%1;
    if(this.fire)this.fire.scale.y=1+Math.sin(time*9)*.16;
    for(const cloud of this.clouds){cloud.position.x+=cloud.userData.drift*dt*this.cloudWind;if(cloud.position.x>450)cloud.position.x=-450;}
    for(const bird of this.birds){const d=bird.userData;bird.position.x=d.centerX+Math.cos(time*.18*d.speed+d.offset)*18;bird.position.z=d.centerZ+Math.sin(time*.18*d.speed+d.offset)*18;bird.rotation.y=-time*.18*d.speed-d.offset;}
  }
}
function sceneAdd(scene,mesh){scene.add(mesh);}
