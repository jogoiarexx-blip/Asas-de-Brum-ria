/** Per-species binary models: independent of campaign saves and manual dragon GLBs.
 * Uses IndexedDB only in the browser. Safari private mode may block storage;
 * callers retain an in-memory copy for that playing session. */
const DB='brumaria-species-models-v1',STORE='glb';
export const SPECIES_ASSET_KEYS=Object.freeze(['furia_noite','furia_luz']);
function assertSpecies(id){
  if(!SPECIES_ASSET_KEYS.includes(id))throw Error('Espécie não permitida: '+String(id));
}
function openDatabase(){
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined')return reject(Error('Armazenamento do navegador indisponível.'));
    let request;
    try{request=indexedDB.open(DB,1);}catch(error){reject(error);return;}
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??Error('Não foi possível abrir os modelos salvos.'));
  });
}
async function operation(mode,handler){
  const db=await openDatabase();
  try{
    return await new Promise((resolve,reject)=>{
      let transaction,req,result,finished=false;
      const fail=e=>{if(!finished){finished=true;reject(e??Error('Falha ao salvar GLB'));}};
      try{
        transaction=db.transaction(STORE,mode);
        req=handler(transaction.objectStore(STORE));
        req.onsuccess=()=>result=req.result;
        req.onerror=()=>fail(req.error);
        transaction.oncomplete=()=>{if(!finished){finished=true;resolve(result);}};
        transaction.onabort=()=>fail(transaction.error);
        transaction.onerror=()=>fail(transaction.error);
      }catch(error){fail(error);}
    });
  }finally{db.close();}
}
export async function saveSpeciesModel(id,bytes){
  assertSpecies(id);
  const data=bytes instanceof ArrayBuffer?bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  if(data.byteLength>25*1024*1024)throw Error('O modelo da espécie não pode ultrapassar 25 MB.');
  return operation('readwrite',store=>store.put({bytes:data,updatedAt:Date.now()},id));
}
export async function loadSpeciesModel(id){
  assertSpecies(id);
  const value=await operation('readonly',store=>store.get(id));
  return value?.bytes??null;
}
export async function clearSpeciesModel(id){
  assertSpecies(id);return operation('readwrite',store=>store.delete(id));
}
