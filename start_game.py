#!/usr/bin/env python3
"""HTTP server for local Windows / macOS / Linux and hosted Replit environments."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen
import os
import threading
import webbrowser

os.chdir(Path(__file__).resolve().parent)

def cache_three():
    target = Path('vendor/three.module.js')
    if target.exists() and target.stat().st_size > 100_000:
        return
    if os.environ.get('BRUMARIA_SKIP_DOWNLOAD') == '1':
        return
    target.parent.mkdir(exist_ok=True)
    urls = [
        'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
        'https://unpkg.com/three@0.180.0/build/three.module.js',
    ]
    for url in urls:
        try:
            request = Request(url, headers={'User-Agent': 'Brumaria-1.4.1/1.0'})
            with urlopen(request, timeout=5) as handle:
                data = handle.read(1_500_001)
            if 100_000 < len(data) < 1_500_000 and b'export' in data:
                temp = target.with_suffix('.part')
                temp.write_bytes(data)
                temp.replace(target)
                print('Three.js salvo localmente para proxima execucao offline.', flush=True)
                return
        except Exception as exc:
            print(f'Falha no download Three.js ({url.split("/")[2]}): {exc}', flush=True)
    print('Biblioteca local ainda ausente; navegador tentara obter Three.js pela internet.', flush=True)

cache_three()

def cache_glb_addons():
    """Cache MIT-licensed official three.js r180 GLTFLoader and its utilities.
    Failure is non-fatal; the browser will try a CDN mirror on first GLB import.
    """
    if os.environ.get('BRUMARIA_SKIP_DOWNLOAD') == '1': return
    for name in ('loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js'):
        target=Path('vendor/addons') / name
        if target.exists() and target.stat().st_size > 500: continue
        target.parent.mkdir(parents=True,exist_ok=True)
        for provider in ('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/',
                         'https://unpkg.com/three@0.180.0/examples/jsm/'):
            try:
                request=Request(provider+name,headers={'User-Agent':'Brumaria-GLB/1.4.1'})
                with urlopen(request,timeout=6) as response: data=response.read(160_001)
                if 500 < len(data) < 160_000 and b'import ' in data:
                    tmp=target.with_suffix('.part');tmp.write_bytes(data);tmp.replace(target)
                    print('GLB pronto para importacao local:',name,flush=True);break
            except Exception as exc:
                print('Nao foi possivel guardar',name,':',exc,flush=True)
cache_glb_addons()
requested_port = os.environ.get('PORT')
remote = bool(requested_port or os.environ.get('REPL_ID') or os.environ.get('REPLIT_DEPLOYMENT'))
host = '0.0.0.0' if remote else '127.0.0.1'
port = int(requested_port) if requested_port else (3000 if remote else 8765)
server = None
for candidate in ([port] if remote else range(port, port + 20)):
    try:
        server = ThreadingHTTPServer((host, candidate), SimpleHTTPRequestHandler)
        port = candidate
        break
    except OSError:
        continue
if server is None:
    raise SystemExit(f'Nao foi possivel iniciar o servidor na porta {port}.')
url = f'http://127.0.0.1:{port}/'
print(f'\nASAS DE BRUMARIA v1.4.1 - JOGO THREE.JS\nServidor na porta {port}.\nPressione Ctrl+C para encerrar.\n', flush=True)
if not remote:
    print(f'Acesse: {url}\n', flush=True)
    threading.Timer(1, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nJogo encerrado.')
finally:
    server.server_close()
