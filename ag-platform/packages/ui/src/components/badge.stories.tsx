import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info', 'pending', 'active', 'completed'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Danger',
    variant: 'destructive',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

export const Pending: Story = {
  args: {
    children: 'Pending',
    variant: 'pending',
  },
};

export const Active: Story = {
  args: {
    children: 'Active',
    variant: 'active',
  },
};

export const Completed: Story = {
  args: {
    children: 'Completed',
    variant: 'completed',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const XSmall: Story = {
  args: {
    children: 'XS',
    size: 'xs',
  },
};

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const XLarge: Story = {
  args: {
    children: 'XL',
    size: 'xl',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="pending">Pending</Badge>
      <Badge variant="active">Active</Badge>
      <Badge variant="completed">Completed</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="xs">XS</Badge>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
      <Badge size="xl">XL</Badge>
    </div>
  ),
};

export const WorkflowStatuses: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-32 text-sm font-medium">Pending</span>
        <Badge variant="pending">Pending</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-32 text-sm font-medium">Active</span>
        <Badge variant="active">Active</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-32 text-sm font-medium">Completed</span>
        <Badge variant="completed">Completed</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-32 text-sm font-medium">Error</span>
        <Badge variant="destructive">Error</Badge>
      </div>
    </div>
  ),
};