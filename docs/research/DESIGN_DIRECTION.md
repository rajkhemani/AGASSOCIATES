# Design Direction — advadiityagade.com

Research basis: Awwwards category sweep (`business-corporate`, `institutions`,
`luxury`, `data-visualization`, `winner_category_business-services`), scraped
2026-08-05. Reference screenshots live in `docs/design-references/`.

## The brief in one line

AG Associates is a **banking panel advocate** — the customer is a credit manager
at an HDFC or ICICI branch, not a retail consumer. The site has to read as
*operational infrastructure a bank can rely on*, not as a traditional law firm
brochure. Precision, throughput, and auditability are the selling points.

## Candidates evaluated

| Site | Studio | Awwwards | Why it was considered | Verdict |
| --- | --- | --- | --- | --- |
| [terminal-industries.com](https://terminal-industries.com/) | REJOUICE® | SOTD 7.68 | AI/logistics infrastructure sold to enterprise operators | **Chosen** |
| [mont-fort.com](https://mont-fort.com/) | Immersive Garden | SOTD 7.62 | Commodity trading group, institutional finance tone | Runner-up |
| [sharplink.com](https://www.sharplink.com/) | Studio Freight | — | Fintech, sharp editorial grid, zero border-radius | Partial adoption |
| [ctja.org](https://ctja.org/) | Outside | 7.30 | Actual legal-sector site | Rejected — advocacy nonprofit tone |
| [alethia.earth](https://www.alethia.earth/) | ++hellohello | SOTD 7.34 | Verification/audit narrative | Rejected — climate-tech visual language |

### Why Terminal Industries

It solves the same rhetorical problem AG Associates has: *convince a
risk-averse institutional buyer that an automated system is more reliable than
the manual process it replaces.* Its answer is a neutral, almost industrial
canvas where the only decoration is data — numbered mono labels, tight display
type, and one saturated accent reserved exclusively for action.

Montfort is the more beautiful site, but its impact rests on commissioned aerial
photography and a conglomerate structure (Trading / Capital / Maritime / Energy).
AG Associates has neither, and imitating it without the asset budget produces a
hollow result.

## Extracted design DNA (from `getComputedStyle`, not estimated)

### Terminal Industries — the spine

| Token | Measured value | How we adapt it |
| --- | --- | --- |
| Display face | `SuisseIntl`, weight 400 | **Not adopted** — Instrument Serif, see below |
| Data/label face | `Geist Mono` | Geist Mono — adopt directly |
| H1 | `70px` / lh `66.5px` / ls `-3.6px` | `clamp(2.75rem, 7vw, 5.25rem)`, lh `0.94`, ls `-0.028em` |
| Section H2 | `34.5px` / lh `41.4px` / ls `-0.61px` | `clamp(2rem, 4.2vw, 3.25rem)`, lh `1.04`, ls `-0.02em` |
| Mono eyebrow | `13px`, uppercase, ls `2.34px` | ls `0.18em`, numbered `01 / 02 / 03` |
| Nav pill label | `11px`, ls `1.5px` | same |
| Ink | `rgb(5, 36, 36)` — near-black green | AG ink `#0A0F14` |
| Accent | `rgb(171, 255, 2)` — acid lime | **Not adopted** — see below |
| Radius | `8px` (cards), `1px` (inputs) | same |
| Scroll | Lenis smooth scroll | Lenis |
| Media | 4 `<video>`, 1 `<canvas>` | video only where we have real footage |

### SharpLink — partial adoption

Zero border-radius on structural elements and an off-white `#F7F7F5` page ground.
Worth stealing: the refusal to round *everything*. Cards get `8px`; tables,
inputs, and data rows stay sharp, which makes them read as records rather than
widgets.

### What we deliberately do not copy

Terminal's acid lime (`rgb(171,255,2)`) is wrong for this firm. AG Associates
already has an established identity in the existing `landing/` page — gold
(authority, Indian legal convention) and emerald (clearance, "go"). We keep that
palette and borrow only Terminal's *structural* discipline: how much space the
type gets, how labels are set, how restrained the motion is.

## Resulting system

```
Ink            #0A0F14   page ground (dark sections)
Paper          #F7F7F5   page ground (light sections)
Gold           #C9A227   accent — authority, primary CTA
Emerald        #0E7C5A   accent — status "cleared", compliance
Mist           #6B7785   secondary text
Hairline       rgba(255,255,255,0.10) / rgba(10,15,20,0.10)
```

Type: **Instrument Serif** (display), **Geist** (body + UI), **Geist Mono**
(labels, case IDs, statutory references, table data). All three are
open-licensed and load via `next/font`.

The display face was originally Geist, chosen to mirror Terminal's SuisseIntl.
That was right for a flat page and wrong once the site acquired depth: a neutral
grotesk set large on a dark ground reads as generic product marketing, which is
the one thing this firm cannot afford to look like. A high-contrast display
serif against mono data labels reads instead as *senior counsel* — the register
of a judgment masthead or a private bank's annual report — and it is the same
register Montfort gets from photography. Geist keeps the body and UI text, where
its neutrality is an asset; Geist Mono is unchanged and still does the
instrument work.

Instrument Serif ships a single weight by design. At display sizes its stroke
contrast does the work a weight axis normally would, and carrying one weight
keeps the added webfont cost to a single file. The italic is reserved for one
clause per section, so it stays an emphasis rather than a texture.

## Motion rules

Per the design-engineering pass, motion is scored by how often a user sees it:

- **Header pill collapse** — seen every session. `transform` + `background`
  only, 200ms, `cubic-bezier(0.23, 1, 0.32, 1)`. No layout animation.
- **Section reveals** — seen once per scroll. `opacity` + `translateY(14px)` +
  a 7° `rotateX`, 420/620ms ease-out, 60ms stagger, capped at 4 items.
- **Card hover** — pointer-tracked 3D tilt, ±8°, spring (stiffness 260, damping
  26). Gated behind `@media (hover: hover) and (pointer: fine)`.
- **Button press** — `scale(0.97)`, 140ms ease-out.
- **Process stepper** — scroll-driven, **not** click tabs. The SOP flows are
  linear; making them clickable misrepresents them.
- `prefers-reduced-motion: reduce` drops every transform, keeps opacity.

No entrance animates from `scale(0)`.

### Revision — the depth pass

The original rule "nothing exceeds 300ms" was written for a flat page, where a
long transition only reads as lag. It does not survive contact with a
scroll-linked 3D rig: a scrubbed transform has no duration at all, it has a
*mapping*, and the durations that remain are entrances (0.9–1.05s), which at
those distances read as weight rather than delay. The rule is replaced by:

- **Scroll-linked transforms have no duration.** They map scroll position to
  transform directly and must be scrubbable in both directions. Nothing
  scroll-driven may be a one-shot trigger.
- **Entrances may run to ~1.1s** when the element travels in Z or hinges on an
  axis. Anything that only fades stays under 600ms.
- **Depth is a single global scalar,** `--depth` / `useDepth()`: 1 on desktop,
  0.55 on handheld, 0 under reduced motion. Every rotation in the site is
  authored at full desktop magnitude and multiplied by it. There are no
  per-breakpoint rotation values anywhere in the codebase.

### Why depth, given no photography budget

Montfort was the runner-up above and was rejected only because its impact rests
on commissioned aerial photography. CSS 3D is the way to get that register
without the asset budget: perspective, layered planes, and parallax spread cost
no image requests at all. The whole depth system — engraved grounds, the raked
figure panel, the filing deck, the coverage floor — is gradients and transforms.
Zero bytes of imagery ship with it.

### The filing deck

The centrepiece is a scroll-scrubbed stack of document plates in the process
section, one per SOP stage, ending in an emerald `REGISTERED` seal. Three
constraints hold it together:

- **Plates are warm paper (`#f2efe6`) on the ink ground, never dark-on-dark.** A
  dim card at 34% opacity against `#0a0f14` reads as a rendering fault, not a
  document. Reversing them out is what makes the stack legible at a glance.
- **Departure travels down and back, never toward the camera.** A plate moving
  forward grows larger than the one taking focus and frames it like a mat board.
- **The plate in focus holds opacity 1 across a plateau**, not just at the
  instant of arrival — otherwise the queued plate behind shows through its face
  for most of its dwell.

The deck is `aria-hidden`. It carries no prose, and the stage copy beside it is
ordinary flowing content, so the section is fully readable with the rig ignored.
