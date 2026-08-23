.PHONY: slice-pass-a slice-gate slice-pass-b phase-e2e setup-hooks deterministic-ready

slice-pass-a:
	./.github/skills/deterministic-verification/scripts/run-unit-verification.sh --slice "$(SLICE)" $(COMMAND)

slice-gate:
	./.github/skills/deterministic-verification/scripts/evaluate-integration-gate.sh --report "$(REPORT)"

slice-pass-b:
	./.github/skills/deterministic-verification/scripts/run-integration-verification.sh --slice "$(SLICE)" $(COMMAND)

phase-e2e:
	./.github/skills/deterministic-verification/scripts/run-phase-e2e.sh --phase "$(PHASE)" $(COMMAND)

setup-hooks:
	./.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh

deterministic-ready:
	./.github/skills/deterministic-verification/scripts/bootstrap-deterministic-verification.sh