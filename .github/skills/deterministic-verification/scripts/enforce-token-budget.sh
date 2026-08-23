#!/usr/bin/env bash
set -euo pipefail
payload=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --payload) payload="$2"; shift 2 ;;
    *) printf 'unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
[[ -n "$payload" && -f "$payload" ]] || { printf '%s\n' '--payload must name a readable file' >&2; exit 2; }
bytes="$(wc -c < "$payload" | tr -d ' ')"
tokens=$(( (bytes + 3) / 4 ))
level=ok
[[ $tokens -ge 130000 ]] && level=warning
[[ $tokens -ge 150000 ]] && level=split_required
jq -n --argjson bytes "$bytes" --argjson estimatedTokens "$tokens" --arg level "$level" '{bytes:$bytes,estimatedTokens:$estimatedTokens,level:$level}'
[[ "$level" != split_required ]]