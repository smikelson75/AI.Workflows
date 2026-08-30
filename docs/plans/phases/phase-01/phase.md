# Phase 01 - Rule Catalog Foundation

- **Phase objective:** establish the tested policy boundary that exposes compact active Rule Metadata and loads full Rule bodies only on demand.
- **User-visible outcome:** the Review Gate has two active construction Rules whose applicability can be selected without putting their complete guidance into initial review context.
- **Backend/data scope:** Markdown Rule documents and YAML frontmatter; a JavaScript Rule Catalog loader; focused Node tests.
- **UI/workflow scope:** none; the catalog is consumed by the later Review Subagent workflow.
- **Cross-slice invariants:** active Rule parsing, validation, and loading failures fail closed; metadata loading does not read Rule bodies; Rule bodies are loaded before any Finding can be based on them; the two seeded Rules preserve named-state Static Factory exceptions and the Complex Constructor threshold.
- **Prerequisites:** Node is available for `node --test`.
- **Acceptance checks:** metadata lists active Rules without their bodies; full Rule retrieval returns complete policy only for a selected Rule; malformed active metadata or body causes a surfaced failure; both seeded Rules encode the PRD criteria.
- **Useful-if-stopped statement:** policy can be authored, validated, and selected with minimal context even before it is wired into the hook-enforced review workflow ([ADR 0001](../../../adr/0001-hook-enforced-rule-loading.md)).
- **Risks and mitigations:** frontmatter parsing could introduce an unnecessary dependency; use an implementation compatible with the dependency-free Node verification baseline.
- **Test checkpoints:** focused catalog behavior is proven through Node's built-in test runner; the final slice covers metadata-only loading, selected body loading, malformed active Rules, and seeded Rule semantics.
- **Definition of done:** catalog behavior and seeded Rules pass the phase's final integration validation, ready to be invoked from Copilot CLI hook scripts rather than from Review Subagent's own tool calls ([ADR 0001](../../../adr/0001-hook-enforced-rule-loading.md)).

## Slice order

1. [Slice 01 - Load Rule Metadata](slice-01-load-rule-metadata.md)
2. [Slice 02 - Validate Catalog Behavior (integration/E2E)](slice-02-validate-catalog-behavior.md)
