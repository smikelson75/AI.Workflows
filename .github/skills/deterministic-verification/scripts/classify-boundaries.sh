#!/usr/bin/env bash
set -euo pipefail

diff_base=""
files=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --diff-base) diff_base="$2"; shift 2 ;;
    --file) files+=("$2"); shift 2 ;;
    *) printf 'unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [[ ${#files[@]} -eq 0 ]]; then
  if [[ -n "$diff_base" ]]; then
    while IFS= read -r file; do files+=("$file"); done < <(git diff --name-only "$diff_base"...HEAD; git diff --name-only; git ls-files --others --exclude-standard)
  else
    while IFS= read -r file; do files+=("$file"); done < <(git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard)
  fi
fi

printf '%s\n' "${files[@]}" | awk 'NF && !seen[$0]++' | while IFS= read -r file; do
  case "$file" in
    *.md|*.mdx|*.txt|*.rst) printf '%s\tdocumentation\n' "$file" ;;
    *route*|*controller*|*handler*|*http*|*api*|*client*) printf '%s\thttp\n' "$file" ;;
    *migration*|*repository*|*repo*|*query*|*database*|*storage*) printf '%s\tdatabase\n' "$file" ;;
    *file*|*filesystem*|*fs*|*path*) printf '%s\tfilesystem\n' "$file" ;;
    *queue*|*consumer*|*producer*|*pubsub*|*message*) printf '%s\tqueue\n' "$file" ;;
    *sdk*|*adapter*|*integration*|*external*) printf '%s\texternal_api\n' "$file" ;;
    *serial*|*protocol*|*wire*|*dto*|*schema*) printf '%s\tserialization\n' "$file" ;;
    *) printf '%s\tunknown\n' "$file" ;;
  esac
done