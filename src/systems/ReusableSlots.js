/** Fixed-capacity object pool. Create instances once, reuse without allocating
 * during particle bursts, collisions or frames. No Three.js dependency. */
export class ReusableSlots {
  constructor(capacity,make){
    if(!Number.isInteger(capacity)||capacity<0||typeof make!=='function')throw new RangeError('Invalid capacity or slot factory');
    this.capacity=capacity;
    this.active=[];
    this.free=Array.from({length:capacity},(_,i)=>make(i));
  }
  take(){
    if(!this.free.length)return null;
    const slot=this.free.pop();this.active.push(slot);return slot;
  }
  releaseAt(index){
    if(!Number.isInteger(index)||index<0||index>=this.active.length)return false;
    const last=this.active.length-1;
    const slot=this.active[index];
    this.active[index]=this.active[last];this.active.pop();this.free.push(slot);
    return true;
  }
  trim(limit){
    const count=Math.max(0,Math.min(this.capacity,Math.floor(Number.isFinite(limit)?limit:0)));
    while(this.active.length>count)this.releaseAt(this.active.length-1);
  }
}
