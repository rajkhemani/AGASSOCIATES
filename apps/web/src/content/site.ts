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
  location: "Thane, Maharashtra, India",
  jurisdiction:
    "Thane West (Majiwada / Panchpakhadi) & Mumbai MMR Sub-Registrar Offices",
  barCouncil: "Bar Council of Maharashtra & Goa",
  servesLabel: "Applicable for Bank & NBFC",
} as const;

export const nav = [
  { label: "Practice", href: "#practice" },
  { label: "Process", href: "#process" },
  { label: "Technology", href: "#technology" },
  { label: "Coverage", href: "#coverage" },
] as const;

export const hero = {
  eyebrow: "Banking panel advocates · Thane & Mumbai MMR",
  headlineLead: "Banking legal ops,",
  headlineAccent: "documented end to end.",
  body: "A specialised banking panel advocate practice handling Notice of Intimation filings, mortgage registration, and statutory public notices for commercial banks, housing finance companies, and NBFCs.",
  primaryCta: { label: "Request empanelment kit", href: "#empanelment" },
  secondaryCta: { label: "Read the process", href: "#process" },
} as const;

/** Operating commitments carried over from the existing site. */
export const figures = [
  {
    value: "24",
    unit: "hrs",
    label: "NOI filing target",
    note: "From complete document set to portal submission",
  },
  {
    value: "48",
    unit: "hrs",
    label: "Title report turnaround",
    note: "Search, encumbrance review, and certification",
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
} as const;
