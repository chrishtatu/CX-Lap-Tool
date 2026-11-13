#!/usr/bin/env python3
"""Run the CX-Lap-Tool tests in headless Chrome.

    python3 tests/run.py              # every case
    python3 tests/run.py replay       # only cases whose file name contains "replay"
    python3 tests/run.py -v           # also show passing checks

Each case in tests/cases/ (and tests/local/) is a JavaScript snippet. It is injected into a copy of
index.html together with tests/lib/*.js, run in headless Chrome, and its check() results are read
back from the page. Cases in tests/local/ use real .fit files from tests/fixtures/, which is not
committed (rides contain GPS tracks). A local case is skipped when a fixture it needs is missing.
Its first line names the fixtures it needs:  // fixtures: westhill treehouse

Needs Python 3 and Google Chrome or Chromium. Set CHROME=/path/to/chrome if it isn't found.
"""
import base64, glob, html, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, '..', 'index.html')
LIBS = ['harness.js', 'synth.js', 'warp.js']


def find_chrome():
    if os.environ.get('CHROME'):
        return os.environ['CHROME']
    for name in ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']:
        p = shutil.which(name)
        if p:
            return p
    for p in ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe']:
        if os.path.exists(p):
            return p
    sys.exit('Chrome not found. Install Google Chrome or Chromium, or set CHROME=/path/to/chrome.')


def build_page(case_src, fixtures):
    case_src = case_src.replace('</script', '<\\/script')  # a literal closing tag in a case would end the injected script
    app = open(APP, encoding='utf-8').read()
    libs = '\n'.join(open(os.path.join(HERE, 'lib', f), encoding='utf-8').read() for f in LIBS)
    fx = ','.join(f'{json.dumps(k)}:__buf("{v}")' for k, v in fixtures.items())
    script = f"""<script>
function __buf(b){{const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer;}}
{libs}
const A=window.CXApp,FIX={{{fx}}};
window.addEventListener('load',async()=>{{
  try{{ {case_src}\n }}catch(e){{ check('case ran without an exception', false, e.message+' '+(e.stack||'').split('\\n')[1]); }}
  if(T.errors.length) check('no uncaught page errors', false, T.errors.join(' | '));
  document.body.setAttribute('data-test', JSON.stringify(T.checks));
}});
</script>"""
    i = app.rfind('</body>')
    return app[:i] + script + app[i:]


def run_case(chrome, path, verbose):
    src = open(path, encoding='utf-8').read()
    name = os.path.relpath(path, HERE)
    fixtures = {}
    m = re.match(r'\s*//\s*fixtures:\s*(.+)', src)
    if m:
        for fx in m.group(1).split():
            fp = os.path.join(HERE, 'fixtures', fx + '.fit')
            if not os.path.exists(fp):
                print(f'SKIP  {name}  (needs tests/fixtures/{fx}.fit)')
                return 0, 0, 1
            fixtures[fx] = base64.b64encode(open(fp, 'rb').read()).decode()
    with tempfile.TemporaryDirectory() as td:
        page = os.path.join(td, 'test.html')
        open(page, 'w', encoding='utf-8').write(build_page(src, fixtures))
        try:
            dom = subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--window-size=1300,1800',
                                  '--virtual-time-budget=90000', '--dump-dom', 'file://' + page],
                                 capture_output=True, text=True, timeout=300).stdout
        except subprocess.TimeoutExpired:
            print(f'FAIL  {name}  (timed out)')
            return 0, 1, 0
    m = re.search(r'data-test="([^"]*)"', dom)
    if not m:
        print(f'FAIL  {name}  (no results: the page did not finish)')
        return 0, 1, 0
    checks = json.loads(html.unescape(m.group(1)))
    bad = [c for c in checks if not c['ok']]
    print(f"{'FAIL' if bad else 'PASS'}  {name}  ({len(checks) - len(bad)}/{len(checks)})")
    for c in checks:
        if not c['ok'] or verbose:
            print(f"   {'ok  ' if c['ok'] else 'FAIL'}  {c['name']}" + (f"  [{c['detail']}]" if c['detail'] else ''))
    return len(checks) - len(bad), len(bad), 0


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    verbose = '-v' in sys.argv
    chrome = find_chrome()
    cases = sorted(glob.glob(os.path.join(HERE, 'cases', '*.js'))) + sorted(glob.glob(os.path.join(HERE, 'local', '*.js')))
    if args:
        cases = [c for c in cases if any(a in os.path.basename(c) for a in args)]
    ok = bad = skip = 0
    for c in cases:
        o, b, s = run_case(chrome, c, verbose)
        ok += o; bad += b; skip += s
    print(f'\n{ok} checks passed, {bad} failed' + (f', {skip} case(s) skipped' if skip else ''))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
