from pathlib import Path
import subprocess,re,hashlib,base64,json
repo=Path(__file__).resolve().parents[2];base='e21805eafc2a7a09e4dac2f8cd740840653cb798'
def old(file):return subprocess.check_output(['git','-C',str(repo),'show',base+':'+file])
html=(repo/'omoti_anikina.html').read_bytes()
inline=lambda data:re.findall(rb'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',data,re.S)
assert inline(html)==inline(old('omoti_anikina.html')),'Inline native/boot scripts changed'
for file in ['omoti_kassa.html','omoti_sovetskaya.html','omoti_cashier-sw.js']:
 assert (repo/file).read_bytes().replace(b'\r\n',b'\n')==old(file).replace(b'\r\n',b'\n'),file+' changed'
sealed=[]
for tag in re.findall(r'<(?:script|link)\b[^>]*\bintegrity="[^"]+"[^>]*>',html.decode()):
 url=re.search(r'(?:src|href)="([^"]+)"',tag)[1].split('?')[0].removeprefix('./');expected=re.search(r'integrity="([^"]+)"',tag)[1];got='sha384-'+base64.b64encode(hashlib.sha384((repo/url).read_bytes().replace(b'\r\n',b'\n') if url.endswith(('.js','.css')) else (repo/url).read_bytes()).digest()).decode();assert got==expected,url;sealed.append(url)
assert 'kassa-feedback/v2/feedback.js' in sealed
assert len(list((repo/'kassa-feedback/sounds').glob('*.mp3')))==9
assert not (repo/'kassa-feedback/sounds/10-tap-optional.mp3').exists()
sw=(repo/'omoti_anikina-sw.js').read_text();assert 'skipWaiting' not in sw.split('// Optional feedback r2.')[1];assert 'caches.delete' not in sw;assert "cache:'no-store'" in sw
adapter=(repo/'releases/20261021-feedback-r2/anikina-interface.js').read_text();assert 'KMotion.vibrate()' not in adapter
print('PASS native/boot inline exact; both other cashiers+worker unchanged;',len(sealed),'SRI; supplied sounds 01–09; no cache/storage cleanup')
