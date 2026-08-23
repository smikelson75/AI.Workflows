#!/usr/bin/env bash
set -euo pipefail
slice=""
[[ "${1:-}" == --slice ]] && { slice="$2"; shift 2; }
command="${UNIT_TEST_COMMAND:-$*}"
[[ -n "$slice" ]] || { printf '%s\n' '--slice is required' >&2; exit 2; }
[[ -n "$command" ]] || { printf '%s\n' 'set UNIT_TEST_COMMAND or pass a command after --slice' >&2; exit 2; }
printf 'Running unit verification for %s\n' "$slice"
eval "$command"