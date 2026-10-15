#!/usr/bin/env python3
"""HTTP server for local Windows / macOS / Linux and hosted Replit environments."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import threading
import webbrowser

os.chdir(Path(__file__).resolve().parent)
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
print(f'\nASAS DE BRUMARIA v1.0.0 - JOGO THREE.JS\nServidor na porta {port}.\nPressione Ctrl+C para encerrar.\n', flush=True)
if not remote:
    print(f'Acesse: {url}\n', flush=True)
    threading.Timer(1, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nJogo encerrado.')
finally:
    server.server_close()
