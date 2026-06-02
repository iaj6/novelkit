# Brief

<!--
This is the only required input. Write your story premise here, plus any constraints you want the
agent to respect. Anything you leave open, the agent will decide.

The "Audience and register" and "Exemplar passages" sections matter more than you'd think — they
are how the pipeline calibrates voice, pacing, and chapter conventions to the kind of book you
actually want. Vague register defaults to "literary adult fiction"; if you want anything else
(YA, pulp adventure, romance, comic, etc.), be specific here.
-->

## Premise

(One or two paragraphs. Who is the protagonist? What's the world like? What's the central tension or question the story turns on?)

## Length and shape

- Target length: ~10,000 words
- Number of chapters: 5

## Voice

(e.g. "third-person limited past, restrained prose, sparse dialogue" — or "first-person present, lyrical, dialogue-heavy". Don't worry about being exhaustive; the audience fields below sharpen this.)

## Audience and register

These fields tell the architect how to tailor per-agent guidance for this book. Leave blank to default to "literary adult fiction" — the pipeline's native register. Override aggressively if you want something else.

- **Target audience age range**: (e.g., "13-15 / YA", "16-18 / upper YA", "adult literary", "adult genre", "all ages")
- **Voice pace**: (fast / medium / slow — "fast" means short sentences, dialogue-forward, immediate; "slow" means longer sentences, more interiority, scene-builds)
- **Reading-grade target** (rough): (e.g., "7th grade", "9th grade", "college", "no specific target")
- **POV count intent**: (e.g., "one anchor protagonist", "two co-leads", "ensemble of 3-5", "rotating per chapter")
- **Chapter-ending convention**: (cliffhangers common / mid-action common / literary fades / mixed by design)

*Brief-writing note on closing register: avoid prescriptive language elsewhere in the brief (especially in `## Voice` or `## Constraints`) about a uniform closing style — phrases like "literary fade at the close of the book" tend to produce 80%+ of chapters ending in the same mode across the manuscript. Descriptive guidance ("quiet endings welcome where the chapter wants them" or "the closing register may resolve quietly when the substance calls for it") gives the drafter room to vary while still honoring the voice. Mixed-by-design above is the safest default unless the genre demands otherwise.*

## Exemplar passages

Paste 1-3 short opening passages (100-300 words each) from real books whose voice and cadence you want this to read like. These give the architect concrete anchors — much stronger than describing the voice abstractly.

If you have no exemplars, leave this section empty and describe the voice in prose above. The architect will do its best, but exemplars are the single strongest lever for getting the register you want.

```
(paste exemplar passage 1 here, with attribution: e.g. "Six of Crows opening — Leigh Bardugo")
```

```
(paste exemplar passage 2 here, optional)
```

## Constraints (optional)

- (Hard rules the agent must respect. Leave empty if none.)

## Research scope (optional — including this section enables the researcher phase)

Use this section if the story depends on real-world facts the pipeline should ground before canon is built. Including this section (or setting `"research": true` in `cdk.config.json`) triggers the **researcher phase**, which runs before the architect and produces `canon/research.md` — a dossier of cited facts that downstream phases treat as ground truth.

Skip this section for fully invented worlds (fantasy, sci-fi, contemporary fiction with no historical anchors) — the researcher is wasted on briefs that don't need grounding.

What to put here: a short bulleted list of the topics the researcher should dig into. Be specific. The researcher classifies your brief and designs its own dossier sections, but a focused scope keeps it honest about what matters for *your* story.

Examples of useful scope items (illustrative — yours should match your brief):

- A specific historical event your story sits inside or alongside (with the named participants, places, timeline)
- A specialist procedure the plot depends on (and the period-correct vocabulary for it)
- A real place whose physical and social texture must be accurate
- A profession or trade whose daily practice the protagonist lives inside
- Period material culture (tools, dress, foodways, money) where modern defaults would betray the setting

Tool budget: the researcher has 30 `WebSearch` and 30 `WebFetch` calls per run. Generous for a focused scope; tight if you ask it to research everything. Keep the scope sharp.

```
- (research topic 1)
- (research topic 2)
- (research topic 3)
```
