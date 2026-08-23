#!/usr/bin/env bash
set -euo pipefail
phase=""
[[ "${1:-}" == --phase ]] && { phase="$2"; shift 2; }
command="${E2E_COMMAND:-$*}"
[[ -n "$phase" ]] || { printf '%s\n' '--phase is required' >&2; exit 2; }
[[ -n "$command" ]] || { printf '%s\n' 'set E2E_COMMAND or pass a command after --phase' >&2; exit 2; }
printf 'Running phase E2E verification for %s\n' "$phase"
eval "$command"