#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$root" ]] || { printf '%s\n' 'not inside a git repository' >&2; exit 2; }
cd "$root"

base='.github/skills/deterministic-verification'
hooks_dir="$base/hooks"

command -v jq >/dev/null 2>&1 || {
  printf '%s\n' 'jq is required for deterministic verification (install jq and retry)' >&2
  exit 2
}

[[ -d "$hooks_dir" ]] || {
  printf 'missing hooks directory: %s\n' "$hooks_dir" >&2
  exit 2
}

git config core.hooksPath "$hooks_dir"

hooks_path="$(git config --get core.hooksPath || true)"
[[ "$hooks_path" == "$hooks_dir" ]] || {
  printf 'core.hooksPath must be %s (found: %s)\n' "$hooks_dir" "${hooks_path:-<unset>}" >&2
  exit 2
}

for hook in "$hooks_dir"/pre-commit "$hooks_dir"/pre-push; do
  [[ -f "$hook" ]] || { printf 'missing hook file: %s\n' "$hook" >&2; exit 2; }
  [[ -x "$hook" ]] || chmod +x "$hook"
done

printf '%s\n' 'deterministic verification bootstrap complete'