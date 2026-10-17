/** Isolated, optional IndexedDB storage. Never blocks the game's save system. */
const DB='brumaria-hero-model-v1', STORE='files', KEY='hero';
function openDB(){
 return new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined')return reject(new Error('Este navegador não permite armazenamento local de GLB.'));
   let request;
   try{request=indexedDB.open(DB,1);}catch(e){return reject(e);}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
   request.onerror=()=>reject(request.error??new Error('Falha IndexedDB'));
   request.onsuccess=()=>resolve(request.result);
 });
}
async function transact(mode,action){
 const db=await openDB();
 try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode),req=action(tx.objectStore(STORE));
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error??new Error('Erro ao salvar GLB'));
   tx.onerror=()=>reject(tx.error??new Error('Erro no armazenamento GLB'));
 });}finally{db.close();}
}
export async function saveHeroGLB(file){
 if(file.size>20*1024*1024)throw new Error('Modelo aplicado, mas maior que 20 MB: não será salvo automaticamente neste dispositivo.');
 return transact('readwrite',store=>store.put({name:file.name,blob:file,lastModified:Date.now()},KEY));
}
export async function loadSavedHeroGLB(){return await transact('readonly',store=>store.get(KEY))??null;}
export async function clearSavedHeroGLB(){return transact('readwrite',store=>store.delete(KEY));}
