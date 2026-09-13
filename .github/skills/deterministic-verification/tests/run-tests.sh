#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_root="$(cd "$script_dir/.." && pwd)"
validator="$skill_root/scripts/validate-report.sh"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

failed=0

run_test() {
  local name="$1"
  local expected_exit="$2"
  local json_content="$3"
  local report_file="$temp_dir/report.json"

  printf '%s' "$json_content" > "$report_file"
  set +e
  out=$("$validator" --kind a --report "$report_file" 2>&1)
  status=$?
  set -e

  if [[ $status -eq $expected_exit ]]; then
    printf 'PASS: %s\n' "$name"
  else
    printf 'FAIL: %s (expected exit %d, got %d)\nOutput: %s\n' "$name" "$expected_exit" "$status" "$out"
    failed=$((failed + 1))
  fi
}

# 1. Valid behavior report
run_test "valid behavior report" 0 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "behavior",
  "changedFiles": ["src/index.ts"],
  "boundaryChanges": [],
  "redVerification": {
    "command": "npm test",
    "expectedFailure": "expected failure",
    "observedFailure": "actual failure"
  },
  "unitVerificationKind": "test",
  "unitVerificationCommand": "npm test",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": "npm run verify",
  "staticVerificationResult": "pass",
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 2. Behavior report missing Red evidence
run_test "behavior report missing redVerification" 1 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "behavior",
  "changedFiles": ["src/index.ts"],
  "boundaryChanges": [],
  "redVerification": null,
  "unitVerificationKind": "test",
  "unitVerificationCommand": "npm test",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 3. Behavior report with empty command
run_test "behavior report with empty command" 1 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "behavior",
  "changedFiles": ["src/index.ts"],
  "boundaryChanges": [],
  "redVerification": {
    "command": "",
    "expectedFailure": "expected",
    "observedFailure": "observed"
  },
  "unitVerificationKind": "test",
  "unitVerificationCommand": "npm test",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 4. Behavior report using static verification as unit verification
run_test "behavior report using static verification as unit verification" 1 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "behavior",
  "changedFiles": ["src/index.ts"],
  "boundaryChanges": [],
  "redVerification": {
    "command": "npm test",
    "expectedFailure": "expected",
    "observedFailure": "observed"
  },
  "unitVerificationKind": "static",
  "unitVerificationCommand": "npm run verify",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 5. Valid non-behavior report with reason
run_test "valid non-behavior report with reason" 0 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "non_behavior",
  "changedFiles": ["docs/example.md"],
  "boundaryChanges": [],
  "redVerification": null,
  "unitVerificationKind": "static",
  "unitVerificationCommand": "npm run verify",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": "documentation contract update",
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 6. Non-behavior report missing reason
run_test "non-behavior report missing reason" 1 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "non_behavior",
  "changedFiles": ["docs/example.md"],
  "boundaryChanges": [],
  "redVerification": null,
  "unitVerificationKind": "static",
  "unitVerificationCommand": "npm run verify",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 7. Unknown property rejection
run_test "unknown property rejection" 1 '{
  "sliceId": "phase-01/slice-01",
  "changeKind": "behavior",
  "unexpectedProperty": 123,
  "changedFiles": ["src/index.ts"],
  "boundaryChanges": [],
  "redVerification": {
    "command": "npm test",
    "expectedFailure": "expected",
    "observedFailure": "observed"
  },
  "unitVerificationKind": "test",
  "unitVerificationCommand": "npm test",
  "unitVerificationResult": "pass",
  "staticVerificationCommand": null,
  "staticVerificationResult": null,
  "tddNotApplicableReason": null,
  "integrationTargetsSuggested": [],
  "risks": []
}'

# 8. evaluate-integration-gate detects untracked files and blocks mismatch
test_gate_mismatch() {
  local gate="$skill_root/scripts/evaluate-integration-gate.sh"
  local test_untracked="temp_test_untracked_file.tmp"
  touch "$test_untracked"
  local report_file="$temp_dir/gate-mismatch-report.json"
  printf '%s' '{
    "sliceId": "phase-01/slice-01",
    "changeKind": "behavior",
    "changedFiles": [],
    "boundaryChanges": [],
    "redVerification": {
      "command": "npm test",
      "expectedFailure": "expected",
      "observedFailure": "observed"
    },
    "unitVerificationKind": "test",
    "unitVerificationCommand": "npm test",
    "unitVerificationResult": "pass",
    "integrationTargetsSuggested": [],
    "risks": []
  }' > "$report_file"

  set +e
  gate_out=$("$gate" --report "$report_file" 2>&1)
  gate_status=$?
  set -e
  rm -f "$test_untracked"

  if [[ $gate_status -ne 0 && "$gate_out" == *"report changedFiles does not match the Git change set"* ]]; then
    printf 'PASS: evaluate-integration-gate detects untracked files and rejects mismatch\n'
  else
    printf 'FAIL: evaluate-integration-gate failed to block untracked file mismatch\nOutput: %s\n' "$gate_out"
    failed=$((failed + 1))
  fi
}
test_gate_mismatch

if [[ $failed -gt 0 ]]; then
  printf '\n%d tests failed\n' "$failed" >&2
  exit 1
fi

printf '\nAll report validation tests passed.\n'
