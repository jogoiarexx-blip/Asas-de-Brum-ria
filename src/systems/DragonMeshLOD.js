/** The visual representation changes, never the entity's group, health or save data. */
export function dragonMeshVisibility(level){
 return level==='full'?{high:true,low:false}:
        level==='limited'?{high:false,low:true}:{high:false,low:false};
}
