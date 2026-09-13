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

# Syntax validation against JSON
jq empty "$report" "$schema"

if [[ "$kind" == a ]]; then
  err=$(jq -r '
    def is_non_empty_str: (type == "string" and length > 0);
    def is_str_array: (type == "array" and all(.[]; type == "string"));

    if type != "object" then "report must be a JSON object"
    else
      ([keys[]] - [
        "sliceId", "changeKind", "changedFiles", "boundaryChanges",
        "redVerification", "unitVerificationKind", "unitVerificationCommand",
        "unitVerificationResult", "staticVerificationCommand", "staticVerificationResult",
        "tddNotApplicableReason", "integrationTargetsSuggested", "risks"
      ]) as $extra_keys
      | if ($extra_keys | length) > 0 then "unknown properties: \($extra_keys | join(", "))"
      elif (.sliceId | is_non_empty_str | not) then "sliceId must be a non-empty string"
      elif (.changeKind != "behavior" and .changeKind != "non_behavior") then "changeKind must be \"behavior\" or \"non_behavior\""
      elif (.changedFiles | is_str_array | not) then "changedFiles must be an array of strings"
      elif (.boundaryChanges | is_str_array | not) then "boundaryChanges must be an array of strings"
      elif (.integrationTargetsSuggested | is_str_array | not) then "integrationTargetsSuggested must be an array of strings"
      elif (.risks | is_str_array | not) then "risks must be an array of strings"
      elif (.unitVerificationCommand | is_non_empty_str | not) then "unitVerificationCommand must be a non-empty string"
      elif (.unitVerificationResult | is_non_empty_str | not) then "unitVerificationResult must be a non-empty string"
      elif (.changeKind == "behavior") then
        if .unitVerificationKind != "test" then "unitVerificationKind must be \"test\" for behavior changes"
        elif .redVerification == null or (.redVerification | type != "object") then "redVerification object is required for behavior changes"
        elif ([.redVerification | keys[]] - ["command", "expectedFailure", "observedFailure"] | length) > 0 then "unknown properties in redVerification"
        elif (.redVerification.command | is_non_empty_str | not) then "redVerification.command must be a non-empty string"
        elif (.redVerification.expectedFailure | is_non_empty_str | not) then "redVerification.expectedFailure must be a non-empty string"
        elif (.redVerification.observedFailure | is_non_empty_str | not) then "redVerification.observedFailure must be a non-empty string"
        elif .tddNotApplicableReason != null and (.tddNotApplicableReason | type != "null") then "tddNotApplicableReason must be null for behavior changes"
        else empty end
      elif (.changeKind == "non_behavior") then
        if .redVerification != null and (.redVerification | type != "null") then "redVerification must be null for non-behavior changes"
        elif (.tddNotApplicableReason | is_non_empty_str | not) then "tddNotApplicableReason must be a non-empty string for non-behavior changes"
        elif (.unitVerificationKind != "static" and .unitVerificationKind != "other" and .unitVerificationKind != "test") then "unitVerificationKind must be \"static\", \"other\", or \"test\""
        else empty end
      else empty end
      | if . != null and . != "" then .
        elif (.staticVerificationCommand != null and (.staticVerificationCommand | type != "null")) and (.staticVerificationCommand | is_non_empty_str | not) then "staticVerificationCommand must be a non-empty string when provided"
        elif (.staticVerificationResult != null and (.staticVerificationResult | type != "null")) and (.staticVerificationResult | is_non_empty_str | not) then "staticVerificationResult must be a non-empty string when provided"
        elif (.staticVerificationCommand != null and .staticVerificationResult == null) then "staticVerificationResult is required when staticVerificationCommand is provided"
        elif (.staticVerificationResult != null and .staticVerificationCommand == null) then "staticVerificationCommand is required when staticVerificationResult is provided"
        else empty end
    end
  ' "$report")
else
  err=$(jq -r '
    def is_non_empty_str: (type == "string" and length > 0);
    def is_str_array: (type == "array" and all(.[]; type == "string"));
    def is_non_empty_str_array: (type == "array" and length > 0 and all(.[]; is_non_empty_str));

    if type != "object" then "report must be a JSON object"
    else
      ([keys[]] - [
        "sliceId", "integrationTestsChanged", "harnessChanges",
        "integrationVerificationCommands", "integrationVerificationResult", "remainingRisks"
      ]) as $extra_keys
      | if ($extra_keys | length) > 0 then "unknown properties: \($extra_keys | join(", "))"
      elif (.sliceId | is_non_empty_str | not) then "sliceId must be a non-empty string"
      elif (.integrationTestsChanged | is_str_array | not) then "integrationTestsChanged must be an array of strings"
      elif (.harnessChanges | is_str_array | not) then "harnessChanges must be an array of strings"
      elif (.integrationVerificationCommands | is_non_empty_str_array | not) then "integrationVerificationCommands must be a non-empty array of non-empty strings"
      elif (.integrationVerificationResult | is_non_empty_str | not) then "integrationVerificationResult must be a non-empty string"
      elif (.remainingRisks | is_str_array | not) then "remainingRisks must be an array of strings"
      else empty end
    end
  ' "$report")
fi

if [[ -n "$err" ]]; then
  printf 'report validation failed: %s\n' "$err" >&2
  exit 1
fi

printf '%s\n' "valid Engineer $kind report: $report"