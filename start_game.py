#!/usr/bin/env python3
"""HTTP server for local Windows/macOS/Linux and Replit. Caches three.js GLB addons."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request,urlopen
import os
import threading
import webbrowser

os.chdir(Path(__file__).resolve().parent)
def cache_script(target,urls,min_size=500,max_size=160000):
    path=Path(target)
    if path.exists() and path.stat().st_size>min_size:return
    if os.environ.get('BRUMARIA_SKIP_DOWNLOAD')=='1':return
    path.parent.mkdir(parents=True,exist_ok=True)
    for url in urls:
        try:
            with urlopen(Request(url,headers={'User-Agent':'Brumaria-GLB/1.3.0'}),timeout=6) as response:
                data=response.read(max_size+1)
            if min_size<len(data)<=max_size and b'import ' in data:
                temp=path.with_suffix('.part');temp.write_bytes(data);temp.replace(path)
                print('Recurso baixado:',path,flush=True);return
        except Exception as exc:
            print('Nao foi possivel obter',path,':',exc,flush=True)
cache_script('vendor/three.module.js',[
    'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
    'https://unpkg.com/three@0.180.0/build/three.module.js'],100000,1500000)
for addon in ('loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js'):
    cache_script('vendor/addons/'+addon,[
        'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/'+addon,
        'https://unpkg.com/three@0.180.0/examples/jsm/'+addon])
requested_port=os.environ.get('PORT')
remote=bool(requested_port or os.environ.get('REPL_ID') or os.environ.get('REPLIT_DEPLOYMENT'))
host='0.0.0.0' if remote else '127.0.0.1'
port=int(requested_port) if requested_port else (3000 if remote else 8765)
server=None
for candidate in ([port] if remote else range(port,port+20)):
    try:
        server=ThreadingHTTPServer((host,candidate),SimpleHTTPRequestHandler);port=candidate;break
    except OSError:continue
if server is None:raise SystemExit('Nenhuma porta disponivel.')
url=f'http://127.0.0.1:{port}/'
print(f'Asas de Brumaria v1.3.0 em {url}',flush=True)
if not remote:threading.Timer(1,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
