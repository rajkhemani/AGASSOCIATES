import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState, EmptyStateCard } from './empty-state';
import { Button } from './button';
import { Inbox, FileText, Users, Search, Settings, Archive, Mail, ClipboardList } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No data available',
    description: 'Get started by creating your first item.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No documents yet',
    description: 'Create your first document to get started.',
    action: { label: 'Create Document', onClick: () => alert('Create clicked') },
  },
};

export const WithIcon: Story = {
  args: {
    title: 'No messages',
    description: 'When you receive messages, they will appear here.',
    icon: Mail,
  },
};

export const InboxEmpty: Story = {
  args: {
    title: 'Inbox is empty',
    description: 'All caught up! No new messages at the moment.',
    icon: Inbox,
  },
};

export const NoResults: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
    icon: Search,
  },
};

export const NoFiles: Story = {
  args: {
    title: 'No files uploaded',
    description: 'Drag and drop files here or click to browse.',
    icon: FileText,
    action: { label: 'Upload Files', onClick: () => alert('Upload clicked') },
  },
};

export const NoUsers: Story = {
  args: {
    title: 'No team members',
    description: 'Invite your colleagues to start collaborating.',
    icon: Users,
    action: { label: 'Invite Members', onClick: () => alert('Invite clicked') },
  },
};

export const ArchiveEmpty: Story = {
  args: {
    title: 'Archive is empty',
    description: 'Archived items will appear here.',
    icon: Archive,
  },
};

export const ClipboardEmpty: Story = {
  args: {
    title: 'Clipboard is empty',
    description: 'Copy items to add them to your clipboard.',
    icon: ClipboardList,
  },
};

export const SettingsEmpty: Story = {
  args: {
    title: 'No settings configured',
    description: 'Configure your preferences to personalize your experience.',
    icon: Settings,
    action: { label: 'Open Settings', onClick: () => alert('Settings clicked') },
  },
};

export const CardVariant: Story = {
  render: () => (
    <EmptyStateCard
      title="No projects yet"
      description="Create your first project to get started."
      action={{ label: 'New Project', onClick: () => alert('New project') }}
    />
  ),
};

export const CardWithIcon: Story = {
  render: () => (
    <EmptyStateCard
      title="No cases found"
      description="Create a new case or adjust your filters."
      icon={Search}
      action={{ label: 'New Case', onClick: () => alert('New case') }}
    />
  ),
};

export const InCardGrid: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
      <EmptyStateCard title="No Projects" description="Create your first project" icon={FileText} action={{ label: 'New Project', onClick: () => {} }} />
      <EmptyStateCard title="No Tasks" description="Add tasks to your project" icon={ClipboardList} action={{ label: 'Add Task', onClick: () => {} }} />
      <EmptyStateCard title="No Messages" description="Messages will appear here" icon={Mail} />
      <EmptyStateCard title="No Files" description="Upload files to get started" icon={FileText} action={{ label: 'Upload', onClick: () => {} }} />
      <EmptyStateCard title="No Team Members" description="Invite your team" icon={Users} action={{ label: 'Invite', onClick: () => {} }} />
      <EmptyStateCard title="Archive Empty" description="Archived items appear here" icon={Archive} />
    </div>
  ),
};

export const CustomAction: Story = {
  args: {
    title: 'Custom action example',
    description: 'This empty state has a custom styled action button.',
    action: {
      label: 'Primary Action',
      onClick: () => alert('Custom action!'),
    },
  },
};