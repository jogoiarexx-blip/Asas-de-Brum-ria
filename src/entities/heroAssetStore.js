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
   let tx,req,result,settled=false;
   const fail=error=>{if(!settled){settled=true;reject(error??new Error('Falha ao concluir armazenamento GLB'));}};
   try{
     tx=db.transaction(STORE,mode);
     req=action(tx.objectStore(STORE));
     // put()/delete() requests may succeed while their transaction later aborts.
     // Confirm persistence only after oncomplete fires.
     req.onsuccess=()=>{result=req.result;};
     req.onerror=()=>fail(req.error??new Error('Erro ao salvar GLB'));
     tx.oncomplete=()=>{if(!settled){settled=true;resolve(result);}};
     tx.onabort=()=>fail(tx.error??new Error('Armazenamento GLB cancelado'));
     tx.onerror=()=>fail(tx.error??new Error('Erro no armazenamento GLB'));
   }catch(error){fail(error);}
 });}finally{db.close();}
}

export async function saveHeroGLB(file){
 if(file.size>20*1024*1024)throw new Error('Modelo aplicado, mas maior que 20 MB: não será salvo automaticamente neste dispositivo.');
 return transact('readwrite',store=>store.put({name:file.name,blob:file,lastModified:Date.now()},KEY));
}
export async function loadSavedHeroGLB(){return await transact('readonly',store=>store.get(KEY))??null;}
export async function clearSavedHeroGLB(){return transact('readwrite',store=>store.delete(KEY));}
