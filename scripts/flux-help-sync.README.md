Flux Help Sync Script README

Overview
This script generates a unified diff that synchronizes Flux function help
entries in `ui/src/flux/constants/functions.ts` with the Flux v0 docs from the
local docs-v2 repository.

Files and Paths
- Script: `scripts/flux-help-sync.py`
- Input help file: `ui/src/flux/constants/functions.ts`
- Docs repo (default): `../docs-v2` (override with `--docs-v2-repo-dir`)
- Docs stdlib root: `../docs-v2/content/flux/v0/stdlib`
- Output patch: `flux-help.diff` (repo root)

How it works
1) It scans the docs tree and builds a map of functions using:
   - front matter `title` and `description`
   - the `## Parameters` section
   - the `Function type signature` block
   - the first relevant JavaScript example (multi-line preserved)
   - front matter `flux/v0/tags` for category inference
2) It loads `functions.ts` by evaluating it in a Node VM to collect existing
   help entries.
3) It updates existing entries with doc-derived content and appends new entries
   for functions present in docs but missing in `functions.ts`.
4) It writes the diff to `flux-help.diff`. It does not modify `functions.ts`.

Usage
- Generate a patch: `python scripts/flux-help-sync.py`
- Tag undocumented stubs: `python scripts/flux-help-sync.py --tag-undocumented`
- Prune undocumented entries: `python scripts/flux-help-sync.py --prune-undocumented`
- Prune only removed entries: `python scripts/flux-help-sync.py --prune-removed`
- Set docs-v2 repo location: `python scripts/flux-help-sync.py --docs-v2-repo-dir /path/to/docs-v2`
- Set output path: `python scripts/flux-help-sync.py --output /path/to/flux-help.diff`

Undocumented stubs
- If `--tag-undocumented` is used and a function has no matching documentation page,
  its description is tagged with `(Undocumented)` or set to
  `Undocumented function.`.
- This only affects functions already present in `functions.ts`.

Pruning
- `--prune-undocumented` removes entries missing documentation pages.
- `--prune-removed` removes entries missing documentation pages only if listed as removed
  in `content/flux/v0/release-notes.md` under the docs repo root.

Notes and assumptions
- The docs root defaults to `../docs-v2`. Override it with `--docs-v2-repo-dir`.
- The script skips `_index.md` and `all-functions.md`.
- It omits the `tables` parameter when the signature shows a piped input
  (`<-tables`).
- Examples are always updated from docs for entries with matching pages.
- Examples are extracted from the first JavaScript example block by locating
  the first call to the function and reducing it to a single-line call
  expression (no pipeline, imports, or setup). Full-line and inline `//`
  comments are removed before extracting the call. If no call is found, new
  entries default to `functionName()`, and existing entries keep their current
  example.
- Links are sourced directly from docs-v2 paths (for example,
  `.../flux/v0/stdlib/universe/...`) and existing entries are updated to match.
- Strings are quoted using single or double quotes to satisfy Prettier when
  apostrophes are present.
- If multiple doc pages share the same function name, the script prefers
  non-deprecated entries. If descriptions differ, it keeps all unless the
  only difference is a contrib variant (for example `from`), in which case it
  prefers the non-contrib entry. Otherwise, it prefers non-experimental,
  non-contrib, and prelude packages.
- Variant entries for input-source splits (for example `csv.from`) are defined
  explicitly in `VARIANT_SPECS` in the script.
