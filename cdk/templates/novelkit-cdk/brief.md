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
