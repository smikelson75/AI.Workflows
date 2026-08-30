export const cleanCompletion = {
  sessionId: 'clean-review',
  selectedRuleId: 'simple-constructor',
  finalResponse: 'No Findings. The slice satisfies the selected Rule.',
};

export const matchingFinding = {
  sessionId: 'matching-review',
  selectedRuleId: 'simple-constructor',
  finalResponse: [
    '1. `src/Widget.cs:18`: `Widget.Create(id, name)` only forwards `id` and `name`',
    'to `new Widget(id, name)`, so it adds no construction decision.',
    'Rule ID: simple-constructor',
  ].join(' '),
};

export const unloadedCitation = {
  sessionId: 'unloaded-citation-review',
  finalResponse: [
    '1. `src/Widget.cs:18`: `Widget.Create(id, name)` only forwards constructor values.',
    'Rule ID: simple-constructor',
  ].join(' '),
};

export const adoptedRule = {
  id: 'prefer-named-options',
  title: 'Prefer Named Options for Multi-Value Calls',
  scope: 'function calls',
  triggers: ['three or more related arguments'],
  summary: 'Keep related call arguments named at the call site.',
  criteria: 'Review calls with three or more related arguments.',
  rationale: 'Named options make related values easier to understand.',
  exceptions: 'Keep positional calls when each argument is distinct.',
  examples: 'create({ host, port, timeout })',
  reviewGuidance: 'Report ambiguous positional calls.',
};
