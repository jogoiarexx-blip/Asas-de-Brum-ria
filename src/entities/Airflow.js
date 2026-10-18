/** Arcade-friendly aerodynamic response. Deliberately avoids forced stalls and
 * preserves input priority so existing missions remain accessible. */
export function airflowTarget({airborne=false,speed=0,height=0,up=false,down=false}={}){
 if(!airborne)return 0;
 if(up)return 22;
 if(down)return -20;
 if(!Number.isFinite(speed)||!Number.isFinite(height))return -3;
 if(speed<7&&height>0&&height<14)return -5;
 if(speed<9)return -3.25;
 if(speed<12)return -1.5;
 return 0;
}
/** Gradual speed exchange between climbing, diving and horizontal travel.
 * Less than 2 m/s per second, no frame-sized impulses or NaN propagation. */
export function airflowSpeed(speed=0,vertical=0,dt=0,max=50){
 if(!Number.isFinite(speed))return 0;
 const bound=Number.isFinite(max)?Math.max(0,max):50;
 const old=Math.max(0,Math.min(bound,speed));
 if(!Number.isFinite(vertical)||!Number.isFinite(dt)||dt<=0)return old;
 const impulse=Math.max(-1.25,Math.min(1.8,-vertical*.09));
 return Math.min(bound,Math.max(0,old+impulse*Math.min(dt,.05)));
}
