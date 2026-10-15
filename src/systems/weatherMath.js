// Regras determinísticas sem dependência gráfica: úteis para testes e saves antigos.
export const WEATHER_MODES=Object.freeze([
  Object.freeze({id:'clear',label:'CÉU ABERTO',duration:90,rain:0,wind:0,sky:0x9bdbef,fog:0xa3e2ed,sun:2.65,hemisphere:2.25}),
  Object.freeze({id:'breeze',label:'VENTOS FORTES',duration:85,rain:0,wind:.55,sky:0x82c6d9,fog:0x9acbd1,sun:2.05,hemisphere:2}),
  Object.freeze({id:'rain',label:'CHUVA',duration:95,rain:.65,wind:.4,sky:0x7999ab,fog:0x849ca9,sun:1.35,hemisphere:1.45}),
  Object.freeze({id:'storm',label:'TEMPESTADE',duration:75,rain:1,wind:1,sky:0x465c77,fog:0x65768a,sun:.75,hemisphere:1.1})
]);
export const weatherMode=(id)=>WEATHER_MODES.find(mode=>mode.id===id)??WEATHER_MODES[0];
export function normalizeWeather(data){
  const mode=weatherMode(data?.mode);
  const elapsed=typeof data?.elapsed==='number'&&Number.isFinite(data.elapsed)?Math.max(0,Math.min(mode.duration,data.elapsed)):0;
  return {mode:mode.id,elapsed};
}
export function advanceWeather(data,dt){
  const start=normalizeWeather(data);let index=WEATHER_MODES.findIndex(w=>w.id===start.mode);
  let elapsed=start.elapsed+Math.max(0,Number.isFinite(dt)?dt:0);
  while(elapsed>=WEATHER_MODES[index].duration){elapsed-=WEATHER_MODES[index].duration;index=(index+1)%WEATHER_MODES.length;}
  return {mode:WEATHER_MODES[index].id,elapsed};
}
export function nextWeather(id){const i=WEATHER_MODES.findIndex(w=>w.id===id);return WEATHER_MODES[(i+1)%WEATHER_MODES.length].id;}
