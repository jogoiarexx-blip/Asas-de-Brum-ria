import * as THREE from 'three';
/** Partículas leves e limitadas: sem crescimento infinito de objetos durante o combate. */
export class Effects {
  constructor(scene){
    this.scene=scene;this.particles=[];
    this.geometry=new THREE.TetrahedronGeometry(.75,0);
    this.materials={
      fire:new THREE.MeshBasicMaterial({color:0xffa15e}),
      enemy:new THREE.MeshBasicMaterial({color:0xf06aab}),
      rescue:new THREE.MeshBasicMaterial({color:0x9dffde}),
      impact:new THREE.MeshBasicMaterial({color:0xffe4ae})
    };
  }
  burst(position,type='impact',count=12){
    for(let i=0;i<count&&this.particles.length<140;i++){
      const mesh=new THREE.Mesh(this.geometry,this.materials[type]);mesh.position.copy(position);
      mesh.scale.setScalar(.5+Math.random()*.8);this.scene.add(mesh);
      const theta=Math.random()*Math.PI*2,vertical=(Math.random()-.38)*2;
      const velocity=new THREE.Vector3(Math.cos(theta),vertical,Math.sin(theta)).normalize().multiplyScalar(7+Math.random()*13);
      this.particles.push({mesh,velocity,life:.45+Math.random()*.55,maxLife:1});
    }
  }
  update(dt){
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.life-=dt;
      p.mesh.position.addScaledVector(p.velocity,dt);
      p.velocity.y-=8*dt;p.mesh.rotation.x+=dt*5;p.mesh.rotation.y+=dt*6;
      p.mesh.scale.multiplyScalar(Math.max(.001,1-dt*2.1));
      if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);}
    }
  }
}
