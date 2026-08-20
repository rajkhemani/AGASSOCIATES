import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowStepper, CompactStepper } from './workflow-stepper';

const workflowSteps = [
  {
    id: 'intake',
    label: 'Intake',
    description: 'Initial case intake and document collection',
    status: 'completed' as const,
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Legal team reviews submitted documents',
    status: 'completed' as const,
  },
  {
    id: 'drafting',
    label: 'Drafting',
    description: 'Attorney drafts legal documents',
    status: 'active' as const,
  },
  {
    id: 'approval',
    label: 'Approval',
    description: 'Senior partner reviews and approves',
    status: 'pending' as const,
  },
  {
    id: 'filing',
    label: 'Filing',
    description: 'Documents filed with court/registry',
    status: 'pending' as const,
  },
  {
    id: 'closure',
    label: 'Closure',
    description: 'Case closed and archived',
    status: 'pending' as const,
  },
];

const stepsWithSubSteps = [
  {
    id: 'phase1',
    label: 'Phase 1: Preparation',
    description: 'Initial preparation phase',
    status: 'completed' as const,
    subSteps: [
      { id: '1a', label: 'Gather Documents', status: 'completed' as const },
      { id: '1b', label: 'Client Interview', status: 'completed' as const },
      { id: '1c', label: 'Risk Assessment', status: 'completed' as const },
    ],
  },
  {
    id: 'phase2',
    label: 'Phase 2: Execution',
    description: 'Main execution phase',
    status: 'active' as const,
    subSteps: [
      { id: '2a', label: 'Draft Documents', status: 'active' as const },
      { id: '2b', label: 'Internal Review', status: 'pending' as const },
      { id: '2c', label: 'Client Review', status: 'pending' as const },
    ],
  },
  {
    id: 'phase3',
    label: 'Phase 3: Finalization',
    description: 'Final review and filing',
    status: 'pending' as const,
    subSteps: [
      { id: '3a', label: 'Final Approval', status: 'pending' as const },
      { id: '3b', label: 'Filing', status: 'pending' as const },
      { id: '3c', label: 'Confirmation', status: 'pending' as const },
    ],
  },
];

const simpleSteps = [
  { id: '1', label: 'Start', status: 'completed' as const },
  { id: '2', label: 'Process', status: 'active' as const },
  { id: '3', label: 'Finish', status: 'pending' as const },
];

const meta: Meta<typeof WorkflowStepper> = {
  title: 'Components/WorkflowStepper',
  component: WorkflowStepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorkflowStepper>;

export const Default: Story = {
  args: {
    steps: workflowSteps,
  },
};

export const Vertical: Story = {
  args: {
    steps: workflowSteps,
    orientation: 'vertical',
  },
};

export const WithSubSteps: Story = {
  args: {
    steps: stepsWithSubSteps,
    orientation: 'vertical',
  },
};

export const Compact: Story = {
  args: {
    steps: simpleSteps,
    variant: 'compact',
  },
};

export const CompactHorizontal: Story = {
  args: {
    steps: simpleSteps,
    variant: 'compact',
  },
  render: (args) => <CompactStepper {...args} />,
};

export const Clickable: Story = {
  args: {
    steps: workflowSteps,
    clickable: true,
    onStepChange: (stepId) => alert(`Step clicked: ${stepId}`),
  },
};

export const WithCurrentStep: Story = {
  args: {
    steps: workflowSteps,
    currentStep: 'drafting',
  },
};

export const AllCompleted: Story = {
  args: {
    steps: workflowSteps.map((s) => ({ ...s, status: 'completed' as const })),
  },
};

export const WithErrors: Story = {
  args: {
    steps: [
      { id: '1', label: 'Step 1', status: 'completed' as const },
      { id: '2', label: 'Step 2', status: 'completed' as const },
      { id: '3', label: 'Step 3', status: 'error' as const },
      { id: '4', label: 'Step 4', status: 'pending' as const },
    ],
  },
};

export const WithWarnings: Story = {
  args: {
    steps: [
      { id: '1', label: 'Data Entry', status: 'completed' as const },
      { id: '2', label: 'Validation', status: 'warning' as const },
      { id: '3', label: 'Processing', status: 'active' as const },
      { id: '4', label: 'Confirmation', status: 'pending' as const },
    ],
  },
};

export const Minimal: Story = {
  args: {
    steps: simpleSteps,
    showDescriptions: false,
    showStepNumbers: false,
  },
};

export const Detailed: Story = {
  args: {
    steps: workflowSteps.map((s, i) => ({
      ...s,
      metadata: { duration: `${i + 1} day${i > 0 ? 's' : ''}`, assignee: `User ${i + 1}` },
    })),
    variant: 'detailed',
    orientation: 'vertical',
  },
};

export const LongWorkflow: Story = {
  args: {
    steps: Array.from({ length: 12 }, (_, i) => ({
      id: `step-${i + 1}`,
      label: `Step ${i + 1}`,
      description: `Description for step ${i + 1}`,
      status: (['completed', 'active', 'pending'] as const)[i % 3],
    })),
  },
};

export const LegalWorkflow: Story = {
  args: {
    steps: [
      { id: 'intake', label: 'Client Intake', description: 'Initial consultation and data gathering', status: 'completed' as const },
      { id: 'research', label: 'Legal Research', description: 'Statutory and case law research', status: 'completed' as const },
      { id: 'draft', label: 'Draft Documents', description: 'Prepare contracts, pleadings, motions', status: 'active' as const },
      { id: 'review', label: 'Internal Review', description: 'Peer review and quality check', status: 'pending' as const },
      { id: 'client-review', label: 'Client Review', description: 'Client approval of drafts', status: 'pending' as const },
      { id: 'revise', label: 'Revisions', description: 'Incorporate feedback', status: 'pending' as const },
      { id: 'finalize', label: 'Finalize', description: 'Final document preparation', status: 'pending' as const },
      { id: 'execute', label: 'Execution', description: 'Signatures and notarization', status: 'pending' as const },
      { id: 'file', label: 'Filing', description: 'Court/registry filing', status: 'pending' as const },
      { id: 'serve', label: 'Service', description: 'Serve opposing parties', status: 'pending' as const },
      { id: 'close', label: 'Case Closure', description: 'Archive and close case', status: 'pending' as const },
    ],
    orientation: 'vertical',
  },
};