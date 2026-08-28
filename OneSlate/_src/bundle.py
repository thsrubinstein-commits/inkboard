#!/usr/bin/env python3
"""Lossless unpack/repack for the OneSlate Claude Design bundle (index.html)."""
import re, json, base64, gzip, sys, os

MANIFEST_RE = re.compile(r'(<script type="__bundler/manifest">\s*)(\{.*?\})(\s*</script>)', re.S)
TEMPLATE_RE = re.compile(r'(<script type="__bundler/template">)(.*?)(</script>)', re.S)

def unpack(index_path, outdir):
    src = open(index_path, encoding='utf-8').read()
    os.makedirs(outdir, exist_ok=True)
    man = json.loads(MANIFEST_RE.search(src).group(2))
    order = list(man.keys())
    meta_out = {}
    for uid, meta in man.items():
        raw = base64.b64decode(meta['data'])
        out = gzip.decompress(raw) if meta.get('compressed') else raw
        ext = {'text/javascript':'js','application/javascript':'js','font/woff2':'woff2'}.get(meta['mime'],'bin')
        fn = f"{uid}.{ext}"
        open(os.path.join(outdir, fn), 'wb').write(out)
        meta_out[uid] = {'mime': meta['mime'], 'compressed': meta.get('compressed', False), 'file': fn}
    tmpl = json.loads(TEMPLATE_RE.search(src).group(2).strip())
    open(os.path.join(outdir, 'template.html'), 'w', encoding='utf-8').write(tmpl)
    json.dump({'order': order, 'assets': meta_out}, open(os.path.join(outdir,'_meta.json'),'w'), indent=2)
    print(f"unpacked {len(order)} assets + template.html -> {outdir}")

def pack(index_path, srcdir, out_path):
    src = open(index_path, encoding='utf-8').read()
    meta = json.load(open(os.path.join(srcdir,'_meta.json')))
    newman = {}
    for uid in meta['order']:
        a = meta['assets'][uid]
        data = open(os.path.join(srcdir, a['file']),'rb').read()
        if a['compressed']:
            blob = gzip.compress(data, mtime=0)
        else:
            blob = data
        newman[uid] = {'mime': a['mime'], 'compressed': a['compressed'], 'data': base64.b64encode(blob).decode()}
    tmpl = open(os.path.join(srcdir,'template.html'), encoding='utf-8').read()
    man_json = json.dumps(newman, separators=(',',':'))
    tmpl_json = json.dumps(tmpl).replace('/', '\\u002F')  # match bundler: escape all slashes
    src = MANIFEST_RE.sub(lambda m: m.group(1)+man_json+m.group(3), src, count=1)
    src = TEMPLATE_RE.sub(lambda m: m.group(1)+tmpl_json+m.group(3), src, count=1)
    open(out_path,'w',encoding='utf-8').write(src)
    print(f"packed -> {out_path} ({len(src)} bytes)")

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd=='unpack': unpack(sys.argv[2], sys.argv[3])
    elif cmd=='pack': pack(sys.argv[2], sys.argv[3], sys.argv[4])
