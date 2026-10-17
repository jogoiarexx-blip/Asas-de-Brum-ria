/** Frame health and compact telemetry; no GPU dependency or save schema changes. */
export function shouldSkipRendering({hidden=false,webglLost=false}={}){
 return Boolean(hidden||webglLost);
}
export function performanceSnapshot({fps=0,renderer=null,projectiles=0,effects=0,tier='balanced',mounted=false,visibleIslands=null,totalIslands=null,actorsVisible=null,actorsLimited=null,actorsProxied=null}={}){
 const info=renderer?.info??{};
 const render=info.render??{};
 const memory=info.memory??{};
 const n=(value)=>Number.isFinite(value)?Math.round(value).toLocaleString('pt-BR'):'—';
 return [
   `FPS: ${n(fps)}  |  GRÁFICOS: ${String(tier).toUpperCase()}`,
   `GPU · chamadas: ${n(render.calls)}  |  triângulos: ${n(render.triangles)}`,
   `Memória GPU · geometrias: ${n(memory.geometries)}  |  texturas: ${n(memory.textures)}`,
   `Combate · projéteis: ${n(projectiles)}  |  partículas: ${n(effects)}`,
   ...(visibleIslands===null?[]:[`Cenário · ilhas com vegetação: ${n(visibleIslands)}/${n(totalIslands)}  |  nuvens: 1 lote`]),
   ...(actorsVisible===null?[]:[`LOD · personagens visíveis: ${n(actorsVisible)}  |  animações limitadas: ${n(actorsLimited)}  |  dragões simplificados: ${n(actorsProxied)}`]),
   `Personagem: ${mounted?'montado':'a pé'}  |  F3 fecha o diagnóstico`
 ].join('\n');
}
