import type { Meta, StoryObj } from '@storybook/react';
import { Timeline, CompactTimeline } from './timeline';

const timelineItems = [
  {
    id: '1',
    title: 'Case Created',
    description: 'New case initiated by client',
    timestamp: new Date(Date.now() - 86400000 * 5),
    status: 'completed' as const,
  },
  {
    id: '2',
    title: 'Documents Submitted',
    description: 'All required documents uploaded',
    timestamp: new Date(Date.now() - 86400000 * 4),
    status: 'completed' as const,
  },
  {
    id: '3',
    title: 'Review Started',
    description: 'Legal team began document review',
    timestamp: new Date(Date.now() - 86400000 * 3),
    status: 'completed' as const,
  },
  {
    id: '4',
    title: 'Review in Progress',
    description: 'Senior attorney reviewing contracts',
    timestamp: new Date(Date.now() - 86400000 * 2),
    status: 'active' as const,
  },
  {
    id: '5',
    title: 'Approval Pending',
    description: 'Awaiting partner approval',
    timestamp: new Date(Date.now() - 86400000),
    status: 'pending' as const,
  },
  {
    id: '6',
    title: 'Final Decision',
    description: 'Case will be closed after decision',
    timestamp: new Date(Date.now() + 86400000),
    status: 'pending' as const,
  },
];

const meta: Meta<typeof Timeline> = {
  title: 'Components/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  args: {
    items: timelineItems,
  },
};

export const Compact: Story = {
  args: {
    items: timelineItems,
  },
  render: (args) => <CompactTimeline {...args} maxItems={10} />,
};

export const Horizontal: Story = {
  args: {
    items: timelineItems.slice(0, 4),
    orientation: 'horizontal',
  },
};

export const Reversed: Story = {
  args: {
    items: timelineItems,
    reverse: true,
  },
};

export const WithMetadata: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Contract Signed',
        description: 'Both parties signed the agreement',
        timestamp: new Date('2024-01-15T10:00:00'),
        status: 'completed' as const,
        metadata: { signatory: 'John Doe', witness: 'Jane Smith' },
      },
      {
        id: '2',
        title: 'Payment Received',
        description: 'Initial deposit processed',
        timestamp: new Date('2024-01-16T14:30:00'),
        status: 'completed' as const,
        metadata: { amount: '$50,000', method: 'Wire Transfer' },
      },
      {
        id: '3',
        title: 'Work Commenced',
        description: 'Team started on deliverables',
        timestamp: new Date('2024-01-17T09:00:00'),
        status: 'active' as const,
        metadata: { team: 'Alpha', lead: 'Sarah Connor' },
      },
    ],
  },
};

export const OnlyPending: Story = {
  args: {
    items: timelineItems.filter((item) => item.status === 'pending'),
  },
};

export const OnlyCompleted: Story = {
  args: {
    items: timelineItems.filter((item) => item.status === 'completed'),
  },
};

export const AbsoluteTimestamps: Story = {
  args: {
    items: timelineItems,
    timestampFormat: 'absolute',
  },
};

export const TimeOnlyTimestamps: Story = {
  args: {
    items: [
      { id: '1', title: 'Morning Standup', timestamp: new Date('2024-01-15T09:00:00'), status: 'completed' as const },
      { id: '2', title: 'Code Review', timestamp: new Date('2024-01-15T11:00:00'), status: 'active' as const },
      { id: '3', title: 'Client Meeting', timestamp: new Date('2024-01-15T14:00:00'), status: 'pending' as const },
    ],
    timestampFormat: 'time',
  },
};

export const WithActions: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Document Ready for Review',
        description: 'Contract v2.3 uploaded',
        timestamp: new Date(),
        status: 'pending' as const,
        actions: (
          <div className="flex gap-1">
            <button className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Review</button>
            <button className="text-xs px-2 py-1 border rounded">Download</button>
          </div>
        ),
      },
      {
        id: '2',
        title: 'Payment Processing',
        description: 'Invoice #12345',
        timestamp: new Date(),
        status: 'active' as const,
        actions: (
          <button className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded">Cancel</button>
        ),
      },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'Only Event',
        description: 'This is a single timeline event',
        timestamp: new Date(),
        status: 'active' as const,
      },
    ],
  },
};

export const ManyItems: Story = {
  args: {
    items: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      title: `Event ${i + 1}`,
      description: `Description for event ${i + 1}`,
      timestamp: new Date(Date.now() - 86400000 * i),
      status: (['completed', 'active', 'pending'] as const)[i % 3],
    })),
  },
};