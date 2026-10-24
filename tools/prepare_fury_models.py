#!/usr/bin/env python3
"""Prepare smaller mobile GLBs from the two original Blender/Meshy models.
Python 3 + Pillow. Never changes vertices, bones, animations or UVs.
The master GLBs are copied unchanged (or left alone when already in out dir).
"""
import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
from struct import pack, unpack_from
from PIL import Image

MAGIC=0x46546C67
JSON_CHUNK=0x4E4F534A
BIN_CHUNK=0x004E4942
CLIPS={'Idle','Walk','Fly','Glide','Attack','Hurt','Takeoff','Landing'}
def align(n):return (n+3)&~3

def read_glb(filename):
    raw=Path(filename).read_bytes()
    if len(raw)<28:raise ValueError('GLB incompleto')
    magic,version,length=unpack_from('<III',raw)
    if magic!=MAGIC or version!=2 or length!=len(raw):raise ValueError('Cabeçalho GLB inválido')
    offset=12;chunks=[]
    while offset<len(raw):
        n,kind=unpack_from('<II',raw,offset);offset+=8
        if offset+n>len(raw):raise ValueError('Chunk GLB incompleto')
        chunks.append((kind,raw[offset:offset+n]));offset+=n
    if len(chunks)!=2 or chunks[0][0]!=JSON_CHUNK or chunks[1][0]!=BIN_CHUNK:
        raise ValueError('GLB precisa ter JSON e BIN')
    return json.loads(chunks[0][1]),chunks[1][1],len(raw)

def validate(doc,data):
    if len(doc.get('skins',[]))!=1 or len(doc['skins'][0].get('joints',[]))!=49:
        raise ValueError('A Fúria precisa ter o rig original de 49 ossos')
    if {a.get('name') for a in doc.get('animations',[])}!=CLIPS or len(doc['animations'])!=8:
        raise ValueError('O GLB precisa conter as oito animações')
    if len(doc.get('images',[]))!=3 or len(doc.get('buffers',[]))!=1:
        raise ValueError('Esperadas três texturas e um buffer')
    for view in doc['bufferViews']:
        offset=view.get('byteOffset',0)
        if offset<0 or offset+view['byteLength']>len(data):
            raise ValueError('bufferView ultrapassou o arquivo')

def optimize(src,dest,max_size=1024,quality=86):
    original,data,before=read_glb(src)
    validate(original,data)
    doc=copy.deepcopy(original)
    images={}
    for image in doc['images']:
        id=image['bufferView'];view=doc['bufferViews'][id]
        offset=view.get('byteOffset',0)
        data_slice=data[offset:offset+view['byteLength']]
        with Image.open(io.BytesIO(data_slice)) as im:
            if im.format!='JPEG':raise ValueError('Textura externa ou formato não JPEG')
            im.thumbnail((max_size,max_size),Image.Resampling.LANCZOS)
            output=io.BytesIO()
            im.convert('RGB').save(output,format='JPEG',quality=quality,subsampling=0,optimize=True)
            images[id]=output.getvalue()
    result=bytearray()
    for id,view in enumerate(doc['bufferViews']):
        offset=view.get('byteOffset',0)
        part=images.get(id)
        if part is None:part=data[offset:offset+view['byteLength']]
        dest_pos=align(len(result))
        result.extend(b'\x00'*(dest_pos-len(result)))
        view['byteOffset']=dest_pos;view['byteLength']=len(part)
        result.extend(part)
    result.extend(b'\x00'*(align(len(result))-len(result)))
    doc['buffers'][0]['byteLength']=len(result)
    doc['asset'].setdefault('extras',{})['brumariaMobile']={'textureMax':max_size,'quality':quality,
        'rigAndAnimationsUnchanged':True}
    header=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    header+=b' '*(align(len(header))-len(header))
    glb=pack('<III',MAGIC,2,12+8+len(header)+8+len(result))
    glb+=pack('<II',len(header),JSON_CHUNK)+header
    glb+=pack('<II',len(result),BIN_CHUNK)+result
    Path(dest).write_bytes(glb)
    reduced,raw,_=read_glb(dest)
    validate(reduced,raw)
    if original['meshes']!=reduced['meshes'] or original['skins']!=reduced['skins'] \
       or original['animations']!=reduced['animations'] or original['accessors']!=reduced['accessors']:
        raise ValueError('Geometria ou animação alterada')
    image_views={im['bufferView'] for im in original['images']}
    for id,(old,new) in enumerate(zip(original['bufferViews'],reduced['bufferViews'])):
        if id in image_views:continue
        a=data[old.get('byteOffset',0):old.get('byteOffset',0)+old['byteLength']]
        b=raw[new.get('byteOffset',0):new.get('byteOffset',0)+new['byteLength']]
        if a!=b:raise ValueError('Buffer de rig ou malha alterado na otimização')
    return {'masterBytes':before,'mobileBytes':len(glb),
        'reductionPercent':round(100*(1-len(glb)/before),2),
        'sha256':hashlib.sha256(glb).hexdigest()}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--night',required=True);parser.add_argument('--light',required=True)
    parser.add_argument('--out',required=True);parser.add_argument('--texture-size',type=int,default=1024,
                        choices=(512,1024,2048))
    args=parser.parse_args()
    output=Path(args.out);output.mkdir(parents=True,exist_ok=True)
    report={}
    for id,name,src in [('furia_noite','furia-da-noite',args.night),
                        ('furia_luz','furia-da-luz',args.light)]:
        original=Path(src);data=original.read_bytes()
        master=output/(name+'.glb')
        if original.resolve()!=master.resolve():master.write_bytes(data)
        mobile=output/(name+'-mobile.glb')
        report[id]=optimize(original,mobile,args.texture_size)
    (output/'dragon-species.json').write_text(json.dumps({
        'available':True,'species':['furia_noite','furia_luz'],
        'mobile':True,'mobileTextureMax':args.texture_size
    },indent=2)+'\n',encoding='utf-8')
    (output/'asset-qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
