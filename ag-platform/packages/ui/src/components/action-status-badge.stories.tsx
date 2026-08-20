import type { Meta, StoryObj } from '@storybook/react';
import { ActionStatusBadge, ActionWithStatus, ActionProgressRing } from './action-status-badge';

const meta: Meta<typeof ActionStatusBadge> = {
  title: 'Components/ActionStatusBadge',
  component: ActionStatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'idle', 'pending', 'running', 'completed', 'failed',
        'cancelled', 'paused', 'retrying', 'scheduled', 'queued',
        'blocked', 'requires_review', 'approved', 'rejected'
      ],
    },
    type: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'destructive', 'approval', 'notification', 'background', 'scheduled', 'manual'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'soft', 'dot'],
    },
    animated: {
      control: 'boolean',
    },
    clickable: {
      control: 'boolean',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionStatusBadge>;

export const Idle: Story = {
  args: {
    status: 'idle',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Running: Story = {
  args: {
    status: 'running',
    animated: true,
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
  },
};

export const Failed: Story = {
  args: {
    status: 'failed',
  },
};

export const Cancelled: Story = {
  args: {
    status: 'cancelled',
  },
};

export const Paused: Story = {
  args: {
    status: 'paused',
  },
};

export const Retrying: Story = {
  args: {
    status: 'retrying',
    animated: true,
  },
};

export const Scheduled: Story = {
  args: {
    status: 'scheduled',
  },
};

export const Queued: Story = {
  args: {
    status: 'queued',
  },
};

export const Blocked: Story = {
  args: {
    status: 'blocked',
  },
};

export const RequiresReview: Story = {
  args: {
    status: 'requires_review',
  },
};

export const Approved: Story = {
  args: {
    status: 'approved',
  },
};

export const Rejected: Story = {
  args: {
    status: 'rejected',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['idle', 'pending', 'running', 'completed', 'failed', 'cancelled', 'paused', 'retrying', 'scheduled', 'queued', 'blocked', 'requires_review', 'approved', 'rejected'] as const).map((status) => (
        <ActionStatusBadge key={status} status={status} animated={['running', 'retrying'].includes(status)} />
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ActionStatusBadge status="running" size="xs" label="XS" />
      <ActionStatusBadge status="running" size="sm" label="Small" />
      <ActionStatusBadge status="running" size="md" label="Medium" />
      <ActionStatusBadge status="running" size="lg" label="Large" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ActionStatusBadge status="running" variant="solid" label="Solid" />
        <ActionStatusBadge status="running" variant="outline" label="Outline" />
        <ActionStatusBadge status="running" variant="soft" label="Soft" />
        <ActionStatusBadge status="running" variant="dot" label="Dot" />
      </div>
    </div>
  ),
};

export const WithProgress: Story = {
  render: () => (
    <div className="space-y-4">
      <ActionStatusBadge status="running" label="Processing" progress={25} />
      <ActionStatusBadge status="running" label="Processing" progress={50} />
      <ActionStatusBadge status="running" label="Processing" progress={75} />
      <ActionStatusBadge status="completed" label="Complete" progress={100} />
    </div>
  ),
};

export const DifferentTypes: Story = {
  render: () => (
    <div className="space-y-4">
      {(['default', 'primary', 'secondary', 'destructive', 'approval', 'notification', 'background', 'scheduled', 'manual'] as const).map((type) => (
        <ActionStatusBadge key={type} status="running" type={type} label={type.charAt(0).toUpperCase() + type.slice(1)} />
      ))}
    </div>
  ),
};

export const Clickable: Story = {
  args: {
    status: 'pending',
    label: 'Click me',
    clickable: true,
    onClick: () => alert('Clicked!'),
  },
};

export const WithTooltip: Story = {
  args: {
    status: 'running',
    label: 'Hover me',
    tooltip: 'This action is currently running',
  },
};

export const CustomLabel: Story = {
  args: {
    status: 'running',
    label: 'Custom Label',
  },
};

export const NoLabel: Story = {
  args: {
    status: 'completed',
    showLabel: false,
  },
};

export const NoIcon: Story = {
  args: {
    status: 'running',
    label: 'Running',
    showIcon: false,
  },
};

// ActionWithStatus stories
const actionMeta: Meta<typeof ActionWithStatus> = {
  title: 'Components/ActionWithStatus',
  component: ActionWithStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default actionMeta;
type ActionStory = StoryObj<typeof ActionWithStatus>;

export const ActionDefault: ActionStory = {
  args: {
    status: 'running',
    label: 'Document Processing',
    description: 'Processing uploaded contract documents',
    actions: [
      { label: 'View Details', onClick: () => alert('View Details'), icon: '👁️' },
      { label: 'Cancel', onClick: () => alert('Cancelled'), variant: 'destructive', icon: '❌' },
    ],
  },
};

export const ActionPending: ActionStory = {
  args: {
    status: 'pending',
    label: 'Approval Request',
    description: 'Waiting for partner approval',
    type: 'approval',
    actions: [
      { label: 'Approve', onClick: () => alert('Approved'), variant: 'default', icon: '✅' },
      { label: 'Reject', onClick: () => alert('Rejected'), variant: 'destructive', icon: '❌' },
    ],
  },
};

export const ActionCompleted: ActionStory = {
  args: {
    status: 'completed',
    label: 'Contract Signed',
    description: 'All parties have signed the agreement',
    type: 'approval',
    actions: [
      { label: 'Download', onClick: () => alert('Downloaded'), icon: '📥' },
      { label: 'Share', onClick: () => alert('Shared'), icon: '📤' },
    ],
  },
};

export const ActionFailed: ActionStory = {
  args: {
    status: 'failed',
    label: 'Filing Failed',
    description: 'Court filing rejected due to formatting error',
    type: 'background',
    actions: [
      { label: 'Retry', onClick: () => alert('Retrying'), variant: 'default', icon: '🔄' },
      { label: 'View Error', onClick: () => alert('Error details'), icon: '⚠️' },
    ],
  },
};

// ActionProgressRing stories
const progressMeta: Meta<typeof ActionProgressRing> = {
  title: 'Components/ActionProgressRing',
  component: ActionProgressRing,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default progressMeta;
type ProgressStory = StoryObj<typeof ActionProgressRing>;

export const Progress0: ProgressStory = {
  args: { status: 'pending', progress: 0, size: 60 },
};

export const Progress25: ProgressStory = {
  args: { status: 'running', progress: 25, size: 60 },
};

export const Progress50: ProgressStory = {
  args: { status: 'running', progress: 50, size: 60 },
};

export const Progress75: ProgressStory = {
  args: { status: 'running', progress: 75, size: 60 },
};

export const Progress100: ProgressStory = {
  args: { status: 'completed', progress: 100, size: 60 },
};

export const ProgressFailed: ProgressStory = {
  args: { status: 'failed', progress: 40, size: 60 },
};

export const AllProgressSizes: ProgressStory = {
  render: () => (
    <div className="flex items-center gap-8">
      <ActionProgressRing status="running" progress={50} size={32} />
      <ActionProgressRing status="running" progress={50} size={48} />
      <ActionProgressRing status="running" progress={50} size={64} />
      <ActionProgressRing status="running" progress={50} size={80} />
    </div>
  ),
};

export const ProgressWithPercentage: ProgressStory = {
  args: { status: 'running', progress: 65, size: 80, showPercentage: true },
};

export const ProgressWithoutPercentage: ProgressStory = {
  args: { status: 'running', progress: 65, size: 80, showPercentage: false },
};

export const AllStatusProgress: ProgressStory = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      {(['idle', 'pending', 'running', 'completed', 'failed', 'cancelled', 'paused', 'retrying', 'scheduled', 'queued', 'blocked', 'approved', 'rejected'] as const).map((status) => (
        <div key={status} className="flex flex-col items-center gap-2">
          <ActionProgressRing status={status} progress={status === 'completed' ? 100 : status === 'running' ? 50 : 0} size={60} />
          <span className="text-xs text-center capitalize">{status.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  ),
};