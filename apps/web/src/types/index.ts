export interface WorkflowStage {
  title: string;
  body: string;
  /** Optional checklist rendered under the stage body. */
  detail?: readonly string[];
  /** Heading for the checklist — e.g. "Verification checks". */
  detailLabel?: string;
}

/** A named list rendered as a bordered aside alongside a workflow. */
export interface WorkflowAside {
  label: string;
  items: readonly string[];
}

export interface Workflow {
  slug: string;
  name: string;
  subtitle: string;
  summary: string;
  /** The hand-off chain, e.g. Bank → AG Associates → Government portal. */
  chain: readonly string[];
  stages: readonly WorkflowStage[];
  /** Conditions that cause this workflow to be initiated. */
  trigger?: WorkflowAside;
  /** What is retained per case for audit. */
  records?: WorkflowAside;
  /** Standing compliance requirements. */
  compliance?: WorkflowAside;
}
