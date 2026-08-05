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
| Display face | `SuisseIntl`, weight 400 | Geist (open licence, near-identical grotesk) |
| Data/label face | `Geist Mono` | Geist Mono — adopt directly |
| H1 | `70px` / lh `66.5px` / ls `-3.6px` | `clamp(2.75rem, 6vw, 4.5rem)`, lh `0.95`, ls `-0.045em` |
| Section H2 | `34.5px` / lh `41.4px` / ls `-0.61px` | lh `1.2`, ls `-0.018em` |
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

Type: **Geist** (display + body), **Geist Mono** (labels, case IDs, statutory
references, table data). Both are open-licensed and load via `next/font`.

## Motion rules

Per the design-engineering pass, motion is scored by how often a user sees it:

- **Header pill collapse** — seen every session. `transform` + `background`
  only, 200ms, `cubic-bezier(0.23, 1, 0.32, 1)`. No layout animation.
- **Section reveals** — seen once per scroll. `opacity` + `translateY(12px)`,
  260ms ease-out, 60ms stagger, capped at 4 items.
- **Card hover** — `translateY(-2px)` + hairline brighten, 160ms. Gated behind
  `@media (hover: hover) and (pointer: fine)`.
- **Button press** — `scale(0.97)`, 140ms ease-out.
- **Process stepper** — scroll-driven via `IntersectionObserver`, **not** click
  tabs. The SOP flows are linear; making them clickable misrepresents them.
- `prefers-reduced-motion: reduce` drops every transform, keeps opacity.

Nothing exceeds 300ms. No entrance animates from `scale(0)`.
