/**
 * Firm-level facts and navigation.
 *
 * Sourced from the existing landing page copy and the firm's internal SOPs.
 * Nothing here is invented — see docs/research/SITE_PLAN.md for provenance.
 */

export const firm = {
  name: "AG Associates",
  tagline: "Legal Operations & Banking Workflow Support",
  domain: "advadiityagade.com",
  url: "https://advadiityagade.com",
  email: "admin@advadiityagade.com",
  location: "Thane, Maharashtra, India",
  jurisdiction:
    "Thane West (Majiwada / Panchpakhadi) & Mumbai MMR Sub-Registrar Offices",
  barCouncil: "Bar Council of Maharashtra & Goa",
  servesLabel: "Applicable for Bank & NBFC",
} as const;

/**
 * The named advocate. Banks empanel individuals, not firms, so the enrolment
 * details belong on the page rather than only in the empanelment kit.
 */
export const principal = {
  name: "Aditya H. Gade",
  title: "Advocate · Principal",
  enrolment: "MAH/2838/2014",
  enrolledOn: "15 July 2014",
  practisingSince: "December 2014",
  bio: "Aditya H. Gade has practised property and banking law from Thane since December 2014, working as a panel advocate on secured lending matters for commercial banks, housing finance companies, and NBFCs.",
  associates:
    "The firm works with associate advocates and retired bankers, so files are reviewed by people who have sat on both sides of a sanction.",
} as const;

export const nav = [
  { label: "Practice", href: "#practice" },
  { label: "Process", href: "#process" },
  { label: "Firm", href: "#firm" },
  { label: "Technology", href: "#technology" },
  { label: "Coverage", href: "#coverage" },
  { label: "FAQ", href: "#faq" },
] as const;

export const hero = {
  eyebrow: "Banking panel advocates · Thane & Mumbai MMR",
  headlineLead: "Banking legal ops,",
  headlineAccent: "documented end to end.",
  body: "A specialised banking panel advocate practice handling Notice of Intimation filings, mortgage registration, and statutory public notices for commercial banks, housing finance companies, and NBFCs.",
  primaryCta: { label: "Request empanelment kit", href: "#empanelment" },
  secondaryCta: { label: "Read the process", href: "#process" },
} as const;

/**
 * Operating figures.
 *
 * The 2–3 working day service level is the firm's contractual commitment to
 * panel banks. Faster internal targets exist but are deliberately not
 * published as commitments — a missed SLA on a statutory filing is a worse
 * outcome than a conservative one.
 */
export const figures = [
  {
    value: "2–3",
    unit: "days",
    label: "Standard service level",
    note: "Contractual turnaround for NOI registration and certified copies",
  },
  {
    value: "11",
    unit: "years",
    label: "In practice",
    note: "Property and banking law from Thane since December 2014",
  },
  {
    value: "13",
    unit: "offices",
    label: "Thane SRO coverage",
    note: "Sub-Registrar offices across the Thane belt",
  },
  {
    value: "90",
    unit: "min",
    label: "Registration appointment",
    note: "Typical time on-site at the Registrar's Office",
  },
] as const;

export const practiceAreas = [
  {
    id: "noi",
    title: "Notice of Intimation",
    body: "End-to-end filing under Section 89B of the Registration Act, 1908, within the statutory post-disbursement window.",
  },
  {
    id: "title",
    title: "Title Search & Search Reports",
    body: "Property title investigation, encumbrance search, and clear marketable title certification.",
  },
  {
    id: "mortgage",
    title: "Mortgage Registration",
    body: "Execution of equitable and registered mortgage deeds with statutory Sub-Registrar endorsement.",
  },
  {
    id: "ctc",
    title: "CTC & Encumbrance Certificates",
    body: "Procurement of Certified True Copies from property registries and official clearance certificates.",
  },
  {
    id: "notice",
    title: "Public Notices & Vetting",
    body: "Drafting and publishing statutory newspaper public notices for title verification and claim investigation.",
  },
  {
    id: "transfer",
    title: "Balance Transfers & Franking",
    body: "Loan balance transfer documentation, franking validation, and multi-bank legal reconciliation.",
  },
] as const;

export const automation = {
  eyebrow: "Technology",
  heading: "Deterministic automation, lawyer-reviewed output.",
  body: "Routine clerical steps are automated so that qualified attention goes to verification and judgement — not to retyping a sanction letter.",
  items: [
    {
      title: "Sanction letter extraction",
      body: "Loan amount, property address, borrower KYC, and lender details are parsed directly from the bank's sanction letter, removing transcription error.",
    },
    {
      title: "Challan generation",
      body: "The MTR-6 payment workflow is prepared and the challan copy shared with the bank team over official email, with payment details attached.",
    },
    {
      title: "Portal submission",
      body: "Filing is submitted on the Government Registration Portal with the correct Sub-Registrar office selected for the property's jurisdiction.",
    },
    {
      title: "Status notifications",
      body: "The bank is notified whenever a filing changes state or an acknowledgement is generated, so no case sits unattended.",
    },
  ],
} as const;

/**
 * Existing panel memberships.
 *
 * Named institutions are the strongest trust signal a site like this carries,
 * but panel agreements often restrict naming the lender. Confirm each entry is
 * cleared for public listing before this ships.
 */
export const panels = {
  eyebrow: "Panel memberships",
  heading: "Already on the panel.",
  body: "AG Associates acts as panel advocate on Notice of Intimation and mortgage matters for the following banks and non-banking financial companies.",
  institutions: [
    "Kotak Mahindra Bank Ltd.",
    "Kotak Mahindra Prime Ltd.",
    "Axis Finance Ltd.",
    "Karur Vysya Bank",
    "Cholamandalam Investment and Finance Company Ltd.",
    "Muthoot Homefin (India) Ltd.",
    "Easy Home Finance",
  ],
} as const;

/** Working radius, stated by what is actually covered rather than by claim. */
export const coverage = {
  eyebrow: "Coverage",
  heading: "Filed where the property sits.",
  body: "Registration work runs across the Mumbai Metropolitan Region, with panel-specific coverage extending further into Maharashtra.",
  areas: [
    {
      label: "Core radius",
      value: "Thane, Kalyan and Panvel — including the 13 Sub-Registrar offices across the Thane belt",
    },
    {
      label: "Mumbai",
      value: "End-to-end property registration across Mumbai locations",
    },
    {
      label: "Wider Maharashtra",
      value: "Notice of Intimation filings extend state-wide for certain panels, including Pune and Nagpur",
    },
  ],
} as const;

export const faq = {
  eyebrow: "What goes wrong",
  heading: "The four ways a filing fails.",
  body: "Most rejected filings fail for the same handful of reasons. These are the checks that exist because of what the firm has seen go wrong.",
  items: [
    {
      q: "Missing the Section 89B window",
      a: "A Notice of Intimation must be filed within 30 days of the date of the mortgage — the date the equitable mortgage is created by deposit of title deeds. Miss it and the bank is left holding a security interest that was never properly intimated. Every file is tracked against that date from the moment it is assigned, not against when the papers happened to arrive.",
    },
    {
      q: "Stamp duty miscalculated",
      a: "Stamp duty on an agreement relating to deposit of title deeds runs at 0.3% of the amount secured under Article 6 of Schedule I to the Maharashtra Stamp Act, and the fractional rounding rules catch people out. An incorrect figure means the challan does not match the filing and the Sub-Registrar returns it.",
    },
    {
      q: "Payment routed to the wrong head",
      a: "Government challans separate registration fees from stamp duty across different Major and Minor Head codes. Money paid into the wrong head is not simply corrected at the counter — the filing is rejected and the payment has to be traced and re-routed.",
    },
    {
      q: "Transcription errors in the record",
      a: "A wrong digit in a PAN, or a property description that does not match the title documents, produces a public record that does not do its job. This is why the verification stage compares Index II against the sanction details before anything is submitted, and why discrepancies go back to the bank rather than getting a best guess.",
    },
  ],
} as const;

export const contact = {
  eyebrow: "Empanelment",
  heading: "Add AG Associates to your panel.",
  body: "Share your requirement and we will return the empanelment kit — firm credentials, Bar Council registration, jurisdiction coverage, service schedule, and the SOP pack for each workflow.",
  fields: {
    caseTypes: [
      "Notice of Intimation",
      "Mortgage Registration",
      "Public Notice",
      "Title Search",
      "Other",
    ],
  },
  /**
   * Dictation runs on the browser's own recogniser, so this list is the set of
   * BCP-47 tags a caller may be speaking — not a set of models the firm hosts.
   * Ordered by what the Thane and Mumbai MMR lending desks actually use.
   */
  dictation: {
    label: "Dictation language",
    hint: "Dictate into any field. Nothing is recorded or sent \u2014 your browser does the transcription.",
    readbackLabel: "Read back what I heard",
    languages: [
      { code: "en-IN", name: "English" },
      { code: "hi-IN", name: "\u0939\u093f\u0928\u094d\u0926\u0940" },
      { code: "mr-IN", name: "\u092e\u0930\u093e\u0920\u0940" },
      { code: "gu-IN", name: "\u0917\u0941\u091c\u0930\u093e\u0924\u0940" },
    ],
  },
} as const;
