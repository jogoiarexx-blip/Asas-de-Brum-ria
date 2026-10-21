"""Runs under blender -b source.blend --python this-script -- exported.glb
Only exports model and animation from the authorized CC0 source.
"""
import bpy, sys, json, os
from pathlib import Path

def main():
    try:
        sep=sys.argv.index("--")
        target=Path(sys.argv[sep+1]).resolve()
    except (ValueError,IndexError):
        raise SystemExit("Usage: blender -b cethiel-source.blend --python tools/export_cc0_dragon_blender.py -- out.glb")
    target.parent.mkdir(parents=True,exist_ok=True)
    meshes=[x for x in bpy.data.objects if x.type=="MESH"]
    armatures=[x for x in bpy.data.objects if x.type=="ARMATURE"]
    actions=list(bpy.data.actions)
    print("DRAGON_SOURCE "+json.dumps({"blender":bpy.app.version_string,
      "mesh_count":len(meshes),"armatures":[o.name for o in armatures],
      "actions":[a.name for a in actions],"mesh_names":[x.name for x in meshes]}),flush=True)
    if not meshes:raise RuntimeError("The source .blend has no mesh")
    for obj in bpy.data.objects:
        if obj.type in ("MESH","ARMATURE"):
            obj.hide_viewport=False
            obj.hide_render=False
    scene=bpy.context.scene
    # Export whole scene (including skinned mesh and its bones).
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type in ("MESH","ARMATURE","EMPTY"):
            obj.select_set(True)
    if meshes:
        bpy.context.view_layer.objects.active=meshes[0]
    available=bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs={"filepath":str(target),"export_format":"GLB","use_selection":True,
            "export_animations":True}
    if "export_animation_mode" in available:
        kwargs["export_animation_mode"]="ACTIONS"
    elif "export_nla_strips" in available:
        kwargs["export_nla_strips"]=True
    if "export_force_sampling" in available:kwargs["export_force_sampling"]=True
    if "export_apply" in available:kwargs["export_apply"]=False
    bpy.ops.export_scene.gltf(**kwargs)
    if not target.is_file() or target.stat().st_size<1000:
        raise RuntimeError("Blender GLB exporter produced no useful model")
    print("DRAGON_EXPORT "+json.dumps({"path":str(target),
      "bytes":target.stat().st_size,"actions_source":[a.name for a in actions]}),flush=True)

if __name__=="__main__":main()
