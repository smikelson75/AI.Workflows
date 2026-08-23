# Token Budget Policy

Owner: `deterministic-verification`

Engineer prompts target 90K to 120K tokens. At 130K, warn. At 150K, split the work unless no safe seam exists and the exception is recorded.

The budget script estimates tokens as `ceil(payload_bytes / 4)`. It accepts a payload file or stdin, emits JSON, and never claims precision beyond that estimate. Pass B should receive only the slice, active invariants, gate output, and Engineer A report.
