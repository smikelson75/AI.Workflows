#!/usr/bin/env bash
set -euo pipefail

# Fails closed if an Engineer-role commit (an engineer-*-report.json is present)
# touches product-truth artifacts Engineer must never author. Runs regardless
# of which agent dispatched Engineer, so it cannot be bypassed by skipping
# Orchestrator.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$root" ]] || { printf '%s\n' 'not inside a git repository' >&2; exit 2; }
cd "$root"

reports=()
for candidate in out/engineer-a-report.json out/engineer-b-report.json; do
  [[ -f "$candidate" ]] && reports+=("$candidate")
done
[[ ${#reports[@]} -gt 0 ]] || exit 0

changed_files="$(git diff --cached --name-only | awk 'NF && !seen[$0]++')"
[[ -n "$changed_files" ]] || exit 0

# Check if the staged commit belongs to an Engineer run:
# Either a report is explicitly staged in this commit, or staged files include files from an active Engineer report.
engineer_commit=false
for candidate in "${reports[@]}"; do
  if printf '%s\n' "$changed_files" | grep -Fxq "$candidate"; then
    engineer_commit=true
    break
  fi
  if [[ -f "$candidate" ]]; then
    reported_files="$(jq -r '.changedFiles[]?' "$candidate" 2>/dev/null || true)"
    if [[ -n "$reported_files" ]]; then
      while IFS= read -r rf; do
        [[ -z "$rf" ]] && continue
        if printf '%s\n' "$changed_files" | grep -Fxq "$rf"; then
          engineer_commit=true
          break 2
        fi
      done <<< "$reported_files"
    fi
  fi
done

[[ "$engineer_commit" == true ]] || exit 0

denylist=(
  'CONTEXT.md'
  'UBIQUITOUS-LANGUAGE.md'
  'AGENTS.md'
  'docs/prd/*'
  'docs/plans/*'
)

violations=()
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  for pattern in "${denylist[@]}"; do
    # shellcheck disable=SC2053
    if [[ "$file" == $pattern ]]; then
      violations+=("$file")
      break
    fi
  done
done <<< "$changed_files"

if [[ ${#violations[@]} -gt 0 ]]; then
  {
    printf '%s\n' 'role-scope violation: an Engineer-role report is present, but these workflow-owned artifacts changed:'
    printf '  - %s\n' "${violations[@]}"
    printf '%s\n' 'Engineer implements and tests assigned code slices only. It must not author CONTEXT.md, UBIQUITOUS-LANGUAGE.md, docs/prd/**, docs/plans/**, or AGENTS.md.'
    printf '%s\n' 'What to do:'
    printf '%s\n' '  - If this content belongs to product/domain truth: revert these files and run /brain-storm instead.'
    printf '%s\n' '  - If this content belongs to target behavior, scope, or architecture: revert these files and run /prd-writer instead.'
    printf '%s\n' '  - If this content belongs to sequencing, phases, or slices: revert these files and run /work-planner instead.'
    printf '%s\n' '  - If this content is a phase acceptance.feature: revert it and run /qa-design instead.'
    printf '%s\n' '  - If this content belongs to repository-wide agent guidance: revert this file and run /agent-instructions instead.'
    printf '%s\n' '  - Only Orchestrator may write plan status transitions; even it may only touch the main plan and a single slice Outcome line.'
  } >&2
  exit 1
fi

exit 0
