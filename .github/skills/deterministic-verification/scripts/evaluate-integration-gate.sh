#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

diff_base=""
report=""
output=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --diff-base) diff_base="$2"; shift 2 ;;
    --report) report="$2"; shift 2 ;;
    --output) output="$2"; shift 2 ;;
    *)
      err_json="$(jq -n --arg arg "$1" '{status: "blocked", code: "ERR_UNKNOWN_ARGUMENT", message: ("unknown argument: " + $arg)}')"
      printf '%s\n' "$err_json" >&2
      exit 2
      ;;
  esac
done
if [[ -z "$report" || ! -f "$report" ]]; then
  err_json="$(jq -n --arg report "$report" '{status: "blocked", code: "ERR_MISSING_REPORT", message: "a readable --report is required", details: {report: $report}, suggestedActions: ["PROVIDE_VALID_REPORT"]}')"
  printf '%s\n' "$err_json" >&2
  exit 2
fi
root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$root" ]]; then
  err_json="$(jq -n '{status: "blocked", code: "ERR_NOT_IN_GIT", message: "gate must run inside a Git repository", details: {}, suggestedActions: ["INITIALIZE_OR_NAVIGATE_TO_GIT_REPO"]}')"
  printf '%s\n' "$err_json" >&2
  exit 2
fi
report_path="$report"
[[ "$report_path" == /* ]] && report_path="${report_path#"$root"/}"
output_path="$output"
[[ "$output_path" == /* ]] && output_path="${output_path#"$root"/}"

classifier=("$script_dir/classify-boundaries.sh")
[[ -n "$diff_base" ]] && classifier+=(--diff-base "$diff_base")
classified_all="$(${classifier[@]})"
classified="$(printf '%s\n' "$classified_all" | awk -F '\t' -v report="$report_path" -v output="$output_path" 'NF && $1 != report && $1 != output && $1 != "out/engineer-a-report.json" && $1 != "out/engineer-b-report.json"')"
actual_files="$(printf '%s\n' "$classified" | awk -F '\t' 'NF { print $1 }' | sort -u)"
reported_files="$(jq -r '.changedFiles[]?' "$report" | sort -u)"
missing_from_report="$(comm -23 <(printf '%s\n' "$actual_files" | awk 'NF') <(printf '%s\n' "$reported_files" | awk 'NF'))"
not_in_worktree="$(comm -13 <(printf '%s\n' "$actual_files" | awk 'NF') <(printf '%s\n' "$reported_files" | awk 'NF'))"
if [[ -n "$missing_from_report" || -n "$not_in_worktree" ]]; then
  missing_arr="$(printf '%s\n' "$missing_from_report" | awk 'NF' | jq -Rsc 'split("\n") | map(select(length > 0))')"
  not_in_worktree_arr="$(printf '%s\n' "$not_in_worktree" | awk 'NF' | jq -Rsc 'split("\n") | map(select(length > 0))')"
  err_json="$(jq -n \
    --arg code "ERR_CHANGE_SET_MISMATCH" \
    --arg message "report changedFiles does not match the Git change set; completion is blocked" \
    --argjson missing "$missing_arr" \
    --argjson notInWorktree "$not_in_worktree_arr" \
    '{
      status: "blocked",
      code: $code,
      message: $message,
      details: {
        missingFromReport: $missing,
        notInWorktree: $notInWorktree
      },
      suggestedActions: [
        "RECONCILE_REPORT",
        "STASH_EXTRA_FILES",
        "SPECIFY_DIFF_BASE"
      ]
    }')"
  printf '%s\n' "$err_json" >&2
  exit 1
fi
slice_id="$(jq -r '.sliceId' "$report")"
reasons="$(printf '%s\n' "$classified" | awk -F '\t' '$2 != "" && $2 != "internal" { print $2 }' | sort -u | jq -Rsc 'split("\n") | map(select(length > 0))')"
uncertain="$(printf '%s\n' "$classified" | awk -F '\t' '$2 == "unknown" { found=1 } END { print found ? "true" : "false" }')"
boundary_changes="$(jq -c '.boundaryChanges' "$report")"
integration_required="$(jq -n --argjson reasons "$reasons" --argjson changes "$boundary_changes" --arg uncertain "$uncertain" '$uncertain == "true" or ($reasons | length) > 0 or any($changes[]; . == "unknown")')"
targets="$(jq -c '.integrationTargetsSuggested' "$report")"
json="$(jq -n --arg sliceId "$slice_id" --argjson required "$integration_required" --argjson reasons "$reasons" --argjson targets "$targets" '{sliceId:$sliceId,integrationRequired:$required,reasons:$reasons,targets:$targets}')"
if [[ -n "$output" ]]; then printf '%s\n' "$json" > "$output"; else printf '%s\n' "$json"; fi