/** A short opening after the giant dragon fires: rewards timing, no new save fields. */
export function counterOpportunity({volleyFired=false,health=12}={}) {
 if(!volleyFired)return 0;
 return health<=6?1.3:1.05;
}
export function counterStrike(time=0) {
 const bonus=Number.isFinite(time)&&time>0;
 return {damage:bonus?2:1,bonus};
}
