#!/usr/bin/env python3
"""Split the single-file FATH MATES app into a multi-file static project.

Boundaries are derived from the source file's own <script>/<style> tags and
its section-marker comments, so the split preserves the proven execution
order of the 8 classic script blocks (plus the firebase module).
"""
import re, pathlib, shutil

SRC = pathlib.Path('/home/z/my-project/download/fath-mates.html')
OUT = pathlib.Path('/home/z/my-project/download/fath-mates-site')

lines = SRC.read_text(encoding='utf-8').split('\n')

def find_pairs(open_re, close_re):
    pairs, opened = [], None
    for i, l in enumerate(lines):
        s = l.strip()
        if opened is None and re.match(open_re, s):
            opened = i
        elif opened is not None and re.match(close_re, s):
            pairs.append((opened, i)); opened = None
    return pairs

scripts = find_pairs(r'^<script', r'^</script>')
styles = find_pairs(r'^<style', r'^</style>')
assert len(scripts) == 9, f'expected 9 script blocks, got {len(scripts)}'
assert len(styles) == 2, f'expected 2 style blocks, got {len(styles)}'

def take(a, b):
    """1-indexed inclusive line range."""
    return '\n'.join(lines[a - 1:b])

def seg(pair):
    """Content range of a tag pair as a 1-indexed inclusive line range.
    pair holds 0-indexed tag line indices: content = (open_idx+1 .. close_idx-1) zero-based
    = (open_idx+2 .. close_idx) one-based."""
    return pair[0] + 2, pair[1]

# ── CSS ───────────────────────────────────────────────────────────────────
s1, s2 = seg(styles[0]), seg(styles[1])
assert 'Tokens' in lines[s1[0] - 1] and 'Landing' in lines[s2[0] - 1]
kf = next(i for i in range(s2[0], s2[1] + 1) if 'Keyframes' in lines[i - 1])
css_base = take(s1[0], s1[1])
css_screens = take(s2[0], kf - 1)
css_anim = take(kf, s2[1])

# ── body markup (between </head> and first <script>) ─────────────────────
head_end = next(i for i, l in enumerate(lines) if l.strip() == '</head>')
body = take(head_end + 2, scripts[0][0])   # head_end+2 = first 1-based line after </head>; scripts[0][0] (0-based <script>) == 1-based line before it

body = body.replace(
    'Everything is inside this one file — download it once and open it in your browser.',
    'This is a static website — open the live URL (GitHub Pages / Vercel) in your browser, or serve the project folder with any web server.')
body = body.replace(
    '1. Tap Download &nbsp;•&nbsp; 2. Open the file in Chrome &nbsp;•&nbsp; 3. Sign in',
    '1. Open the site URL &nbsp;•&nbsp; 2. Use Chrome / Edge / Safari &nbsp;•&nbsp; 3. Sign in')
body = body.replace(
    'download the file and open it in your browser (Chrome / Edge / Safari) to use FATH MATES.',
    'open the site in Chrome / Edge / Safari to use FATH MATES.')
assert 'one file' not in body and 'Tap Download' not in body

# ── JS blocks ─────────────────────────────────────────────────────────────
c = [seg(p) for p in scripts]
utils = take(*c[0])
utils = utils.replace(
    '/* ═════════════════════ FATH MATES — single-file edition ═════════════════════',
    '/* ═════════════════════ FATH MATES — app core ═════════════════════')
utils = utils.replace(
    '   No server, no internet needed. Data stays on this device. */',
    '   Live data syncs through Firebase Firestore; the app also boots from a\n'
    '   local mirror when offline. Load order is documented in README.md. */')
assert 'single-file edition' not in utils and 'app core' in utils

js = {
    'utils.js': utils,
    'data.js': take(*c[1]),
    'shell.js': take(*c[2]),
    'feed.js': take(*c[3]),
    'status-chat.js': take(*c[4]),
    'awards.js': take(*c[5]),
    'members.js': take(*c[6]),
}
assert 'database (localStorage)' in js['data.js']
assert 'members admin' in js['members.js']

# block 8 (router / delegation / sync / boot) — split at its ═══ markers
b8 = list(range(c[7][0], c[7][1] + 1))
marks = {}
for i in b8:
    l = lines[i - 1].strip()
    m = re.match(r'^/\* ═+ (.+?) ═+ \*/$', l)
    if m:
        marks[m.group(1).strip()] = i
for want in ('router + boot', 'event delegation', 'firebase live sync', 'boot'):
    assert any(k.startswith(want) for k in marks), f'marker {want!r} not found: {marks}'
r1 = next(v for k, v in marks.items() if k.startswith('router + boot'))
r2 = next(v for k, v in marks.items() if k.startswith('event delegation'))
r3 = next(v for k, v in marks.items() if k.startswith('firebase live sync'))
r4 = next(v for k, v in marks.items() if k == 'boot')
assert r1 < r2 < r3 < r4
js['router.js'] = take(r1, r2 - 1)
js['actions.js'] = take(r2, r3 - 1)
js['sync.js'] = take(r3, r4 - 1)
js['boot.js'] = take(r4, c[7][1])
js['firebase.js'] = take(*c[8])

assert 'const ACTIONS' in js['actions.js']
assert 'var FMS' in js['sync.js']
assert 'initializeApp' in js['firebase.js'] and 'window.FBS' in js['firebase.js']
assert 'function boot' in js['boot.js'] or 'boot()' in js['boot.js']

# ── write project ─────────────────────────────────────────────────────────
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / 'css').mkdir(parents=True)
(OUT / 'js').mkdir()
for name, text in [('base.css', css_base), ('screens.css', css_screens), ('animations.css', css_anim)]:
    (OUT / 'css' / name).write_text(text.rstrip() + '\n', encoding='utf-8')
for name, text in js.items():
    (OUT / 'js' / name).write_text(text.rstrip() + '\n', encoding='utf-8')

JS_ORDER = ['utils.js', 'data.js', 'shell.js', 'feed.js', 'status-chat.js', 'awards.js',
            'members.js', 'router.js', 'actions.js', 'sync.js', 'boot.js']
script_tags = '\n'.join(f'<script src="js/{n}"></script>' for n in JS_ORDER)
script_tags += '\n<script type="module" src="js/firebase.js"></script>'
css_tags = '\n'.join(f'<link rel="stylesheet" href="css/{n}">' for n in ('base.css', 'screens.css', 'animations.css'))

index = (take(1, 8) + '\n'
         + '<link rel="icon" type="image/svg+xml" href="favicon.svg">\n'
         + css_tags + '\n</head>\n' + body + '\n' + script_tags + '\n</body>\n</html>\n')
(OUT / 'index.html').write_text(index, encoding='utf-8')

(OUT / 'favicon.svg').write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    '<stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#db2777"/>'
    '</linearGradient></defs>'
    '<rect width="64" height="64" rx="14" fill="url(#g)"/>'
    '<text x="32" y="43" font-family="Arial,Helvetica,sans-serif" font-size="26" '
    'font-weight="800" fill="#fff" text-anchor="middle">FM</text></svg>\n', encoding='utf-8')
(OUT / '.nojekyll').write_text('', encoding='utf-8')

# ── report ────────────────────────────────────────────────────────────────
files = sorted(p for p in OUT.rglob('*') if p.is_file())
print(f'project files: {len(files)}  (target < 100)')
for p in files:
    print(f'  {p.relative_to(OUT)}  ({p.stat().st_size:,} B)')
assert len(files) < 100
print('OK — split complete')
