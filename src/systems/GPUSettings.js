/** WebGL cannot select a specific GPU. powerPreference is a browser hint. */
export const STORAGE_KEY='brumaria-gpu-options-v1';
const allowed=['default','low-power','high-performance'];
export function normalizeGPUSettings(data){
 return {preference:allowed.includes(data?.preference)?data.preference:'default',
   resolution:[.5,.75,1].includes(Number(data?.resolution))?Number(data.resolution):1,
   shadows:data?.shadows!==false,antialias:data?.antialias!==false};
}
export function readGPUSettings(storage=globalThis.localStorage){
 try{return normalizeGPUSettings(JSON.parse(storage?.getItem(STORAGE_KEY)||'null'));}
 catch{return normalizeGPUSettings(null);}
}
export function writeGPUSettings(settings,storage=globalThis.localStorage){
 const safe=normalizeGPUSettings(settings);
 try{storage?.setItem(STORAGE_KEY,JSON.stringify(safe));return true;}catch{return false;}
}
export function pixelScaleFor(value){return [.5,.75,1].includes(value)?value:1;}
export function chooseContextOptions(settings={}){
 const safe=normalizeGPUSettings(settings);
 return {powerPreference:safe.preference,antialias:safe.antialias};
}
export function describeRenderer(gl){
 if(!gl)return 'GPU indisponível — verifique WebGL e aceleração gráfica.';
 try{
   const ext=gl.getExtension?.('WEBGL_debug_renderer_info');
   const value=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
   return String(value||'GPU não informada pelo navegador').slice(0,150);
 }catch{return 'GPU não informada pelo navegador (restrição de privacidade).';}
}
