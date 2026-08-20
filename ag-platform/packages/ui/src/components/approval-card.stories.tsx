import type { Meta, StoryObj } from '@storybook/react';
import { ApprovalCard } from './approval-card';

const mockApproval = {
  id: 'APR-2024-001',
  title: 'Contract Review Approval',
  description: 'Please review and approve the updated service agreement for Client ABC Corp.',
  status: 'pending' as const,
  requester: {
    name: 'Sarah Johnson',
    role: 'Senior Associate',
    email: 'sarah.johnson@firm.com',
  },
  createdAt: new Date(Date.now() - 86400000 * 2),
  updatedAt: new Date(Date.now() - 3600000),
  dueDate: new Date(Date.now() + 86400000),
  priority: 'high' as const,
  category: 'Contracts',
  tags: ['urgent', 'client-facing', 'revenue'],
  documentUrl: '/documents/contract-abc-v2.pdf',
  documentName: 'Service Agreement v2.3.pdf',
};

const mockApprovalWithComments = {
  ...mockApproval,
  comments: [
    {
      id: 'c1',
      author: { name: 'Michael Chen', role: 'Partner', avatar: undefined },
      content: 'Reviewed sections 4.2 and 5.1. Minor changes needed in liability clause.',
      timestamp: new Date(Date.now() - 7200000),
      type: 'changes_requested' as const,
    },
    {
      id: 'c2',
      author: { name: 'Sarah Johnson', role: 'Senior Associate', avatar: undefined },
      content: 'Updated liability clause per feedback. Please review section 5.1 again.',
      timestamp: new Date(Date.now() - 3600000),
      type: 'comment' as const,
    },
  ],
};

const meta: Meta<typeof ApprovalCard> = {
  title: 'Components/ApprovalCard',
  component: ApprovalCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ApprovalCard>;

export const Pending: Story = {
  args: {
    ...mockApproval,
    status: 'pending',
  },
};

export const Approved: Story = {
  args: {
    ...mockApproval,
    status: 'approved',
    updatedAt: new Date(),
  },
};

export const Rejected: Story = {
  args: {
    ...mockApproval,
    status: 'rejected',
    updatedAt: new Date(),
  },
};

export const ChangesRequested: Story = {
  args: {
    ...mockApproval,
    status: 'changes_requested',
  },
};

export const WithComments: Story = {
  args: mockApprovalWithComments,
};

export const HighPriority: Story = {
  args: {
    ...mockApproval,
    priority: 'urgent',
    dueDate: new Date(Date.now() + 3600000), // 1 hour
  },
};

export const LowPriority: Story = {
  args: {
    ...mockApproval,
    priority: 'low',
    dueDate: new Date(Date.now() + 86400000 * 7),
  },
};

export const Expired: Story = {
  args: {
    ...mockApproval,
    status: 'expired',
    dueDate: new Date(Date.now() - 86400000),
  },
};

export const WithDocument: Story = {
  args: {
    ...mockApproval,
    documentUrl: '/documents/contract.pdf',
    documentName: 'Master Service Agreement.pdf',
  },
};

export const WithoutDocument: Story = {
  args: {
    ...mockApproval,
    documentUrl: undefined,
    documentName: undefined,
  },
};

export const Compact: Story = {
  args: {
    ...mockApproval,
    compact: true,
  },
};

export const CompactApproved: Story = {
  args: {
    ...mockApproval,
    status: 'approved',
    compact: true,
  },
};

export const CompactRejected: Story = {
  args: {
    ...mockApproval,
    status: 'rejected',
    compact: true,
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      {(['pending', 'approved', 'rejected', 'changes_requested', 'expired', 'cancelled'] as const).map((status) => (
        <ApprovalCard
          key={status}
          id={`apr-${status}`}
          title={`Approval ${status.charAt(0).toUpperCase() + status.slice(1)}`}
          description="Sample approval request for demonstration"
          status={status}
          requester={{ name: 'John Doe', role: 'Associate', email: 'john@firm.com' }}
          createdAt={new Date()}
          priority="medium"
        />
      ))}
    </div>
  ),
};

export const AllPriorities: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
        <ApprovalCard
          key={priority}
          id={`apr-${priority}`}
          title={`Priority: ${priority.charAt(0).toUpperCase() + priority.slice(1)}`}
          description="Sample approval with different priority levels"
          status="pending"
          requester={{ name: 'Jane Smith', role: 'Partner', email: 'jane@firm.com' }}
          createdAt={new Date()}
          priority={priority}
        />
      ))}
    </div>
  ),
};