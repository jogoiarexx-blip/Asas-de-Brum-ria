/** Narrow rain streaks instead of square GL point sprites. Graphics-only helper. */
export function rainStreakPoints(position,rain=0,wind=0){
  const intensity=Number.isFinite(rain)?Math.max(0,Math.min(1,rain)):0;
  const gust=Number.isFinite(wind)?Math.max(-3,Math.min(3,wind)):0;
  const {x=0,y=0,z=0}=position??{};
  const length=1.4+intensity*2.3;
  return [x,y,z,x+gust*length*.12,y-length,z+gust*length*.03];
}
