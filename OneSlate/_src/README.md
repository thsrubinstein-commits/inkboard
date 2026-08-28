# OneSlate `_src` — editable source for `index.html`

`index.html` (repo root) is a **Claude Design bundle**: the app's HTML/CSS/JS is
gzip+base64-packed inside `__bundler/manifest` and `__bundler/template` blocks, so
it can't be hand-edited. This folder is the unpacked, readable source.

- `template.html` — the whole app (inline CSS + the `<x-dc>` markup + the `text/x-dc`
  logic script). **This is the file you edit.**
- `9c824682-*.js` — vendor Supabase (do not edit).
- `6f8bf93b-*.js` — Claude Design runtime (do not edit).
- `*.woff2` — bundled fonts.
- `_meta.json` — asset order/metadata used by the packer.
- `bundle.py` — lossless unpack/repack tool.

## Edit workflow
```bash
# from repo root
python3 OneSlate/_src/bundle.py unpack index.html OneSlate/_src   # refresh source from the bundle
# ...edit OneSlate/_src/template.html...
python3 OneSlate/_src/bundle.py pack index.html OneSlate/_src index.html   # rebuild the bundle in place
```
Serve `index.html` (e.g. `python3 -m http.server`) to test. The packer preserves the
bundler's `/` slash-escaping so the block boundaries stay intact.

## Notes on the Coursework module
- Classes live in `state.classes` (synced via `boards.data`, mirroring `events`).
- Assignments are `events` with `kind:'assignment'` (+ `classId`, `atype`, `points`,
  `done`), so they inherit the calendar, `.ics` export, and cloud sync for free.
- Syllabus parsing uses `window.claude.complete` when available and falls back to a
  regex heuristic otherwise; extracted items always land in a review step before saving.
