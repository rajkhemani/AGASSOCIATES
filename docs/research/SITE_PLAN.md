# Site Plan — advadiityagade.com

Companion to [DESIGN_DIRECTION.md](./DESIGN_DIRECTION.md). This maps what gets
built, in what order, and where every piece of copy comes from.

## Content provenance

Every claim on the site traces to one of three sources. Nothing is invented.

| Source | What it supplies |
| --- | --- |
| `AG_Associates_SOP_NOI_Filing1.pdf` | NOI workflow, 8 steps, document checklist, record-management policy |
| `AG_Associates_SOP_Mortgage_Registration1.pdf` | Mortgage registration workflow, 6 steps, ~90-minute registrar timing |
| `AG_Associates_SOP_Public_Notice.pdf` | Public notice workflow, 7 steps, 7/15/30-day objection windows, role matrix |
| `landing/index.html` (existing) | Practice-area descriptions, jurisdiction, credentials, positioning |

The SOPs are the differentiator. Most advocate websites assert competence; this
one can *show the actual process a bank's file moves through*, step by step,
because the firm has documented it. That is the site's central idea.

> **Confidentiality note:** the SOPs are marked "AG Associates — Confidential"
> and carry an internal approval block. The site publishes the *process shape*
> (stages, timings, document checklists) — never the internal role matrix,
> approval signatures, or escalation contacts.

## Page structure

Single marketing page plus two sub-routes. Sections top to bottom:

| # | Section | Interaction model | Source |
| --- | --- | --- | --- |
| 01 | Header | scroll-driven pill collapse | — |
| 02 | Hero | static + one reveal | landing copy |
| 03 | Credential strip | static | landing copy |
| 04 | Practice areas (6) | hover only | landing copy |
| 05 | **Process explorer** | scroll-driven stepper | all three SOPs |
| 06 | Turnaround / SLA figures | count-up on first view | landing copy |
| 07 | Automation advantage (4) | hover only | landing copy |
| 08 | Jurisdiction / coverage | static | landing copy |
| 09 | Empanelment CTA + form | form validation | landing copy |
| 10 | Footer | static | landing copy |

Sub-routes: `/process/[slug]` for each of the three documented workflows, and
`/empanelment` for the full bank onboarding form.

### 05 — Process explorer (the centrepiece)

Three workflows, each rendered as a linear stepper driven by scroll position:

```
NOI Filing              BANK → AG ASSOCIATES → GOVERNMENT PORTAL
                        → RECEIPT GENERATION → BANK

Mortgage Registration   BANK → AG ASSOCIATES → DRAFT & APPROVAL
                        → REGISTRAR'S OFFICE → REGISTERED DOCUMENTS
                        → BANK & CLIENT

Public Notice           DOCUMENTS → TITLE VERIFICATION → DRAFTING
                        → PUBLICATION → WAITING PERIOD
                        → OBJECTION HANDLING → CLOSURE
```

**Interaction model is scroll-driven, not tabbed.** A sticky left rail lists the
stages; the right column scrolls through stage detail; an `IntersectionObserver`
with `rootMargin: "-45% 0px -45% 0px"` marks the active stage. The rail is
readable, not clickable-only — each entry is an anchor link, so keyboard and
screen-reader users get the same navigation.

Below 900px the rail unpins and the stages stack as a numbered list.

### Verifiable detail worth surfacing

These come straight from the SOPs and are the kind of specificity that wins a
panel empanelment:

- NOI case file requires: payment screenshot, sanction letter, Index II, KYC,
  borrower selfie, and an **Aadhaar-linked mobile number** for Citizen Portal OTP
- Challan processed through the **MTR-6** online payment workflow
- Verification scrutiny covers six checks, and any mismatch is escalated to the
  bank *before* filing proceeds
- Mortgage registration at the Sub-Registrar takes **approximately 90 minutes**
- Public notice runs in **one English and one local-language newspaper**
- Objection window is **7, 15, or 30 days** depending on bank requirement and
  risk level
- Archived per case: challans, drafts, approval emails, government receipts,
  supporting documents, communication logs

## Build order

Foundation is sequential; everything after is independent.

1. **Foundation** — `apps/web` scaffold, Geist + Geist Mono, design tokens in
   `globals.css`, `src/types/`, `src/content/` populated from the SOPs
2. **Primitives** — `Container`, `MonoLabel`, `SectionHeading`, `Button`, `Card`
3. **Sections** — header → hero → practice areas → process explorer → figures →
   automation → jurisdiction → CTA → footer
4. **Assembly** — `page.tsx`, Lenis, reduced-motion guard
5. **QA** — 1440 / 768 / 390 viewports, keyboard traversal, `npm run build`

## Out of scope for this pass

Real case-status lookup (the existing landing page's tracker is a mock and stays
one), authentication, CMS, and the Hindi/Marathi localisation the AI pipeline
already supports. All are noted as follow-ups.

## Known issue found during research

`landing/index.html` links its logo to `https://advaiityagade.com` — missing a
`d`. That host does not resolve (proxy returns 502); the live site is
`advadiityagade.com`. Fixed in the new build.
