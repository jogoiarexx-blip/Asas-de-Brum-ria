/** Animated shoulder → elbow → wrist joints. Pure so all 3 dragon species share a tested pose. */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function wingPose({time=0,side=1,phase='ground',speed=0,bank=0,wingLift=0,climbing=0}={}){
  const t=Number.isFinite(time)?time:0;
  const rate=phase==='takeoff'?9.4:phase==='landing'?3.9:phase==='ground'?2.1:5.7+clamp(speed,0,60)*.05;
  const glide=phase==='cruise'&&speed>26&&Math.abs(climbing)<8;
  const amplitude=phase==='takeoff'?.47:phase==='ground'?.055:phase==='landing'?.13:glide?.07:.28;
  const flap=Math.sin(t*rate);
  const trailingFlap=Math.sin(t*rate-.42);
  const lift=clamp(wingLift,0,1);
  const bankComp=clamp(bank,-.41,.41)*.10;
  const travel=clamp(speed,0,52)/52;
  const air=phase!=='ground'&&phase!=='landing';
  const airflow=air?Math.sin(t*10.5+side*.9)*(.018+amplitude*.055):0;
  return {
    shoulder:side*(.30-lift*.21+flap*amplitude+bankComp),
    elbow:side*(.17+trailingFlap*amplitude*.62+(glide?-.08:0)+bankComp*.65),
    wrist:side*(.12+Math.sin(t*rate-.84)*amplitude*.78+(glide?-.06:0)),
    twist:phase==='ground'?.23:glide?-.12:.04,
    sweep:side*(air?(-.055-travel*.14):.035),
    elbowTwist:air?((glide?-.085:.035)+trailingFlap*amplitude*.16):.06,
    wristYaw:side*((glide?-.055:.025)+Math.sin(t*rate-1.15)*amplitude*.14+airflow),
    glide,
  };
}
