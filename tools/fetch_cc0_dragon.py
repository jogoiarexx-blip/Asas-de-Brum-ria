#!/usr/bin/env python3
"""Fetch the author's CC0 dragon with bounded ZIP validation, never executes ZIP content."""
from pathlib import Path
import hashlib, io, json, sys, urllib.request, zipfile
URL="https://opengameart.org/sites/default/files/dragon_oga.zip"
PAGE="https://opengameart.org/content/cethiels-dragon-3d"
def main(out):
    out=Path(out).resolve(); out.mkdir(parents=True,exist_ok=True)
    request=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0 (compatible; BrumariaAssetValidation/1.0)"})
    with urllib.request.urlopen(request,timeout=40) as resp:
        data=resp.read(16_000_001)
    if len(data)>16_000_000 or not zipfile.is_zipfile(io.BytesIO(data)):
        raise ValueError("Source is not a valid ZIP under 16 MB")
    archive=zipfile.ZipFile(io.BytesIO(data))
    items=[]; blends=[]
    for item in archive.infolist():
        if item.is_dir():continue
        name=Path(item.filename.replace("\\","/")).name
        if not name:continue
        if item.file_size>80_000_000:raise ValueError("ZIP entry too big: "+name)
        if item.filename.endswith((".zip",".exe",".py",".sh")):continue
        items.append({"name":item.filename,"size":item.file_size})
        if name.lower().endswith(".blend"):blends.append(item)
    if not blends:raise ValueError("The source ZIP has no .blend file")
    best=max(blends,key=lambda item:item.file_size)
    model=out/"cethiel-source.blend"
    with archive.open(best) as inp,model.open("wb") as dest:
        while chunk:=inp.read(65536):dest.write(chunk)
    manifest={"license":"CC0 per author","author":"Drummyfish with Cethiel","source":PAGE,
      "archive":URL,"archive_bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),
      "source_blend":best.filename,"files":items}
    (out/"source-manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf8")
    print(json.dumps(manifest,indent=2))
if __name__=="__main__":main(sys.argv[1] if len(sys.argv)>1 else "artifacts/cc0")
