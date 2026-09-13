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
    *)
      err_json=$(jq -n --arg arg "$1" '{status: "invalid", code: "ERR_UNKNOWN_ARGUMENT", message: ("unknown argument: " + $arg)}')
      printf '%s\n' "$err_json" >&2
      exit 2
      ;;
  esac
done
if [[ "$kind" != a && "$kind" != b ]]; then
  err_json=$(jq -n '{status: "invalid", code: "ERR_INVALID_KIND", message: "--kind must be a or b"}')
  printf '%s\n' "$err_json" >&2
  exit 2
fi
schema="$skill_root/schemas/engineer-${kind}-report.schema.json"
if [[ -z "$report" || ! -f "$report" || ! -f "$schema" ]]; then
  err_json=$(jq -n --arg report "$report" '{status: "invalid", code: "ERR_MISSING_REPORT", message: "report and matching schema are required", details: {report: $report}}')
  printf '%s\n' "$err_json" >&2
  exit 2
fi

# Syntax validation against JSON
if ! jq empty "$report" 2>/dev/null; then
  err_json=$(jq -n '{status: "invalid", code: "ERR_JSON_SYNTAX_ERROR", message: "report file is not valid JSON"}')
  printf '%s\n' "$err_json" >&2
  exit 1
fi

if [[ "$kind" == a ]]; then
  err=$(jq -c '
    def is_non_empty_str: (type == "string" and length > 0);
    def is_str_array: (type == "array" and all(.[]; type == "string"));
    def err($code; $msg): {code: $code, message: $msg};

    if type != "object" then err("ERR_INVALID_ROOT_TYPE"; "report must be a JSON object")
    else
      ([keys[]] - [
        "sliceId", "changeKind", "changedFiles", "boundaryChanges",
        "redVerification", "unitVerificationKind", "unitVerificationCommand",
        "unitVerificationResult", "staticVerificationCommand", "staticVerificationResult",
        "tddNotApplicableReason", "integrationTargetsSuggested", "risks"
      ]) as $extra_keys
      | if ($extra_keys | length) > 0 then err("ERR_UNKNOWN_PROPERTIES"; "unknown properties: \($extra_keys | join(", "))")
      elif (.sliceId | is_non_empty_str | not) then err("ERR_INVALID_SLICE_ID"; "sliceId must be a non-empty string")
      elif (.changeKind != "behavior" and .changeKind != "non_behavior") then err("ERR_INVALID_CHANGE_KIND"; "changeKind must be \"behavior\" or \"non_behavior\"")
      elif (.changedFiles | is_str_array | not) then err("ERR_INVALID_CHANGED_FILES"; "changedFiles must be an array of strings")
      elif (.boundaryChanges | is_str_array | not) then err("ERR_INVALID_BOUNDARY_CHANGES"; "boundaryChanges must be an array of strings")
      elif (.integrationTargetsSuggested | is_str_array | not) then err("ERR_INVALID_INTEGRATION_TARGETS"; "integrationTargetsSuggested must be an array of strings")
      elif (.risks | is_str_array | not) then err("ERR_INVALID_RISKS"; "risks must be an array of strings")
      elif (.unitVerificationCommand | is_non_empty_str | not) then err("ERR_INVALID_UNIT_COMMAND"; "unitVerificationCommand must be a non-empty string")
      elif (.unitVerificationResult | is_non_empty_str | not) then err("ERR_INVALID_UNIT_RESULT"; "unitVerificationResult must be a non-empty string")
      elif (.changeKind == "behavior") then
        if .unitVerificationKind != "test" then err("ERR_INVALID_UNIT_KIND"; "unitVerificationKind must be \"test\" for behavior changes")
        elif .redVerification == null or (.redVerification | type != "object") then err("ERR_MISSING_RED_EVIDENCE"; "redVerification object is required for behavior changes")
        elif ([.redVerification | keys[]] - ["command", "expectedFailure", "observedFailure"] | length) > 0 then err("ERR_INVALID_RED_PROPERTIES"; "unknown properties in redVerification")
        elif (.redVerification.command | is_non_empty_str | not) then err("ERR_INVALID_RED_COMMAND"; "redVerification.command must be a non-empty string")
        elif (.redVerification.expectedFailure | is_non_empty_str | not) then err("ERR_INVALID_RED_EXPECTED"; "redVerification.expectedFailure must be a non-empty string")
        elif (.redVerification.observedFailure | is_non_empty_str | not) then err("ERR_INVALID_RED_OBSERVED"; "redVerification.observedFailure must be a non-empty string")
        elif .tddNotApplicableReason != null and (.tddNotApplicableReason | type != "null") then err("ERR_INVALID_TDD_REASON"; "tddNotApplicableReason must be null for behavior changes")
        else empty end
      elif (.changeKind == "non_behavior") then
        if .redVerification != null and (.redVerification | type != "null") then err("ERR_INVALID_RED_FOR_NON_BEHAVIOR"; "redVerification must be null for non-behavior changes")
        elif (.tddNotApplicableReason | is_non_empty_str | not) then err("ERR_MISSING_TDD_REASON"; "tddNotApplicableReason must be a non-empty string for non-behavior changes")
        elif (.unitVerificationKind != "static" and .unitVerificationKind != "other" and .unitVerificationKind != "test") then err("ERR_INVALID_UNIT_KIND"; "unitVerificationKind must be \"static\", \"other\", or \"test\"")
        else empty end
      else empty end
      | if . != null and . != "" then .
        elif (.staticVerificationCommand != null and (.staticVerificationCommand | type != "null")) and (.staticVerificationCommand | is_non_empty_str | not) then err("ERR_INVALID_STATIC_COMMAND"; "staticVerificationCommand must be a non-empty string when provided")
        elif (.staticVerificationResult != null and (.staticVerificationResult | type != "null")) and (.staticVerificationResult | is_non_empty_str | not) then err("ERR_INVALID_STATIC_RESULT"; "staticVerificationResult must be a non-empty string when provided")
        elif (.staticVerificationCommand != null and .staticVerificationResult == null) then err("ERR_MISSING_STATIC_RESULT"; "staticVerificationResult is required when staticVerificationCommand is provided")
        elif (.staticVerificationResult != null and .staticVerificationCommand == null) then err("ERR_MISSING_STATIC_COMMAND"; "staticVerificationCommand is required when staticVerificationResult is provided")
        else empty end
    end
  ' "$report")
else
  err=$(jq -c '
    def is_non_empty_str: (type == "string" and length > 0);
    def is_str_array: (type == "array" and all(.[]; type == "string"));
    def is_non_empty_str_array: (type == "array" and length > 0 and all(.[]; is_non_empty_str));
    def err($code; $msg): {code: $code, message: $msg};

    if type != "object" then err("ERR_INVALID_ROOT_TYPE"; "report must be a JSON object")
    else
      ([keys[]] - [
        "sliceId", "integrationTestsChanged", "harnessChanges",
        "integrationVerificationCommands", "integrationVerificationResult", "remainingRisks"
      ]) as $extra_keys
      | if ($extra_keys | length) > 0 then err("ERR_UNKNOWN_PROPERTIES"; "unknown properties: \($extra_keys | join(", "))")
      elif (.sliceId | is_non_empty_str | not) then err("ERR_INVALID_SLICE_ID"; "sliceId must be a non-empty string")
      elif (.integrationTestsChanged | is_str_array | not) then err("ERR_INVALID_TESTS_CHANGED"; "integrationTestsChanged must be an array of strings")
      elif (.harnessChanges | is_str_array | not) then err("ERR_INVALID_HARNESS_CHANGES"; "harnessChanges must be an array of strings")
      elif (.integrationVerificationCommands | is_non_empty_str_array | not) then err("ERR_INVALID_INTEGRATION_COMMANDS"; "integrationVerificationCommands must be a non-empty array of non-empty strings")
      elif (.integrationVerificationResult | is_non_empty_str | not) then err("ERR_INVALID_INTEGRATION_RESULT"; "integrationVerificationResult must be a non-empty string")
      elif (.remainingRisks | is_str_array | not) then err("ERR_INVALID_REMAINING_RISKS"; "remainingRisks must be an array of strings")
      else empty end
    end
  ' "$report")
fi

if [[ -n "$err" ]]; then
  err_json=$(jq -n --argjson err "$err" '{status: "invalid", code: $err.code, message: $err.message}')
  printf '%s\n' "$err_json" >&2
  exit 1
fi

printf '%s\n' "valid Engineer $kind report: $report"