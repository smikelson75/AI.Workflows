#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_root="$(cd "$script_dir/.." && pwd)"

kind=""
report=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --kind) kind="$2"; shift 2 ;;
    --report) report="$2"; shift 2 ;;
    *) printf 'unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
[[ "$kind" == a || "$kind" == b ]] || { printf '%s\n' '--kind must be a or b' >&2; exit 2; }
schema="$skill_root/schemas/engineer-${kind}-report.schema.json"
[[ -f "$report" && -f "$schema" ]] || { printf '%s\n' 'report and matching schema are required' >&2; exit 2; }
jq empty "$report" "$schema"
if [[ "$kind" == a ]]; then
  required='["sliceId","changedFiles","boundaryChanges","unitVerificationCommand","unitVerificationResult","integrationTargetsSuggested","risks"]'
else
  required='["sliceId","integrationTestsChanged","harnessChanges","integrationVerificationCommands","integrationVerificationResult","remainingRisks"]'
fi
jq -e --argjson required "$required" 'type == "object" and (($required - keys) | length == 0) and (.sliceId | type == "string" and length > 0)' "$report" >/dev/null
printf '%s\n' "valid Engineer $kind report: $report"