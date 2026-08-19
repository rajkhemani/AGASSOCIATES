/**
 * The three documented workflows, transcribed from the firm's internal SOPs:
 *
 *   AG_Associates_SOP_NOI_Filing1.pdf
 *   AG_Associates_SOP_Mortgage_Registration1.pdf
 *   AG_Associates_SOP_Public_Notice.pdf
 *
 * The SOPs are marked confidential. What is published here is the *process
 * shape* a client bank needs in order to plan around it — stages, inputs, and
 * timings. Internal role matrices, escalation contacts, and approval blocks
 * stay out of the public site.
 */

import type { Workflow } from "@/types";

export const workflows: Workflow[] = [
  {
    slug: "noi-filing",
    name: "NOI Filing",
    subtitle: "Notice of Intimation, challan processing & registration",
    summary:
      "Filing under Section 89B for secured lending matters, from case assignment through to the government receipt reaching the bank's file.",
    chain: [
      "Bank",
      "AG Associates",
      "Government portal",
      "Receipt generation",
      "Bank",
    ],
    stages: [
      {
        title: "Case assignment",
        body: "The bank representative shares the case through official channels with the borrower details and document set.",
        detail: [
          "Payment screenshot",
          "Sanction letter",
          "Index II",
          "KYC documents",
          "Borrower selfie photograph",
          "Aadhaar-linked mobile number for Citizen Portal OTP",
        ],
        detailLabel: "Case file contents",
      },
      {
        title: "Challan / MTR-6 processing",
        body: "Challan generation runs through the applicable MTR-6 online payment workflow. The challan copy and payment details go back to the bank team over official email.",
      },
      {
        title: "Document verification & scrutiny",
        body: "Every document is verified before filing begins. Any discrepancy, mismatch, or gap is escalated to the bank representative for rectification before the case proceeds.",
        detail: [
          "Borrower name verification",
          "Property detail verification",
          "Loan amount verification",
          "Stamp duty and payment verification",
          "Index II matched against sanction details",
          "KYC validation and supporting document review",
        ],
        detailLabel: "Verification checks",
      },
      {
        title: "NOI draft preparation",
        body: "Once verification and payment are confirmed, the Notice of Intimation draft is prepared for approval.",
      },
      {
        title: "Government portal submission",
        body: "The application is submitted on the Government Registration Portal in accordance with applicable procedural and compliance requirements.",
      },
      {
        title: "Follow-up & coordination",
        body: "Post-submission, the registration office and processing authorities are followed up regularly so the case keeps moving and the receipt is generated on time.",
      },
      {
        title: "Receipt download & closure",
        body: "The government receipt is downloaded, shared with the bank over official email, and archived for audit and future reference.",
      },
    ],
    records: {
      label: "Archived per case",
      items: [
        "Challans",
        "NOI drafts",
        "Approval emails",
        "Government receipts",
        "Supporting documents",
        "Communication logs",
      ],
    },
  },
  {
    slug: "mortgage-registration",
    name: "Mortgage Registration",
    subtitle: "Registrar office workflow",
    summary:
      "Preparation, verification, and execution of mortgage registration at the Sub-Registrar's Office, closing with the registered originals returned to the bank.",
    chain: [
      "Bank",
      "AG Associates",
      "Draft & approval",
      "Registrar's Office",
      "Registered documents",
      "Bank & client",
    ],
    stages: [
      {
        title: "Document intake & completeness check",
        body: "The document set shared by the bank is checked for completeness and consistency against the property records before anything is drafted.",
        detail: ["Sanction letter", "Borrower details / Index", "KYC documents"],
        detailLabel: "Intake set",
      },
      {
        title: "Draft preparation",
        body: "Draft registration documents are prepared with the property owners' names, loan details, and property description held consistent with the supporting records.",
      },
      {
        title: "Internal review & confirmation",
        body: "The draft is reviewed internally and shared for confirmation. The case proceeds only once final approval is obtained, which minimises corrections at the registration stage.",
      },
      {
        title: "Registrar verification & date fixing",
        body: "Documents are verified at the Registrar's Office and the registration date is fixed in coordination with both the banking team and the client.",
      },
      {
        title: "Registration",
        body: "On the scheduled date both parties attend the Registrar's Office and the registration is completed. The appointment generally runs about an hour and a half.",
      },
      {
        title: "Collection & closure",
        body: "The registered originals and endorsed documents are collected from the Registrar's Office, and the final copy and status are shared with the bank and client.",
      },
    ],
  },
  {
    slug: "public-notice",
    name: "Public Notice",
    subtitle: "Objection invitation & clearance",
    summary:
      "A statutory notice inviting objections or claims before a transaction completes — confirming the property is free of disputes and the bank's security interest is protected.",
    chain: [
      "Documents",
      "Title verification",
      "Drafting",
      "Publication",
      "Waiting period",
      "Objection handling",
      "Closure",
    ],
    trigger: {
      label: "Issued when",
      items: [
        "The property owner is deceased",
        "The original property document is misplaced",
      ],
    },
    stages: [
      {
        title: "Receipt of documents",
        body: "The supporting record set is collected before any verification begins.",
        detail: [
          "Property documents",
          "Owner KYC",
          "Chain documents",
          "Death certificate or missing-document FIR copy",
        ],
        detailLabel: "Collected",
      },
      {
        title: "Title verification",
        body: "The legal team verifies the ownership chain and confirms the property description is consistent across documents.",
      },
      {
        title: "Drafting",
        body: "The notice is drafted with the owner's name, property details, nature of the transaction, an invitation for objections or claims, and the response period.",
      },
      {
        title: "Newspaper publication",
        body: "The notice is published in one English newspaper and one local-language newspaper. The publication date is recorded internally and proof of publication is preserved.",
      },
      {
        title: "Waiting period",
        body: "An objection period of 7, 15, or 30 days runs from publication, set by the bank's requirement, the nature of the transaction, and the legal risk level.",
      },
      {
        title: "Objection handling",
        body: "Any objection received is reviewed legally and escalated to the senior legal team; registration may be paused until the matter is clarified. Where no objection is received, the property is treated as clear and the transaction proceeds.",
      },
      {
        title: "Closure",
        body: "Publication copies and proof of publication are archived, an internal clearance note is prepared, and the bank is informed to proceed.",
      },
    ],
    compliance: {
      label: "Compliance points",
      items: [
        "Property details must exactly match the title documents",
        "Owner names must match KYC and ownership records",
        "Newspaper publication proof must be preserved",
        "The objection timeline must complete before proceeding",
        "Any dispute must be documented officially",
      ],
    },
  },
];

export const workflowBySlug = (slug: string) =>
  workflows.find((w) => w.slug === slug);
