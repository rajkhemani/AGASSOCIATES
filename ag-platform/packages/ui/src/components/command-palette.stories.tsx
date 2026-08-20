import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CommandPalette } from './command-palette';
import { Button } from './button';

const mockItems = [
  { id: '1', label: 'New Document', description: 'Create a new document', shortcut: '⌘N', group: 'File', action: () => alert('New Document'), icon: '📄' },
  { id: '2', label: 'Open File', description: 'Open an existing file', shortcut: '⌘O', group: 'File', action: () => alert('Open File'), icon: '📂' },
  { id: '3', label: 'Save', description: 'Save current document', shortcut: '⌘S', group: 'File', action: () => alert('Save'), icon: '💾' },
  { id: '4', label: 'Save As', description: 'Save with a new name', shortcut: '⌘⇧S', group: 'File', action: () => alert('Save As'), icon: '📋' },
  { id: '5', label: 'Cut', description: 'Cut selected text', shortcut: '⌘X', group: 'Edit', action: () => alert('Cut'), icon: '✂️' },
  { id: '6', label: 'Copy', description: 'Copy selected text', shortcut: '⌘C', group: 'Edit', action: () => alert('Copy'), icon: '📋' },
  { id: '7', label: 'Paste', description: 'Paste from clipboard', shortcut: '⌘V', group: 'Edit', action: () => alert('Paste'), icon: '📋' },
  { id: '8', label: 'Undo', description: 'Undo last action', shortcut: '⌘Z', group: 'Edit', action: () => alert('Undo'), icon: '↩️' },
  { id: '9', label: 'Redo', description: 'Redo last undone action', shortcut: '⌘⇧Z', group: 'Edit', action: () => alert('Redo'), icon: '↪️' },
  { id: '10', label: 'Find', description: 'Find in document', shortcut: '⌘F', group: 'Edit', action: () => alert('Find'), icon: '🔍' },
  { id: '11', label: 'Replace', description: 'Find and replace', shortcut: '⌘⌥F', group: 'Edit', action: () => alert('Replace'), icon: '🔄' },
  { id: '12', label: 'Settings', description: 'Open settings', shortcut: '⌘,', group: 'Tools', action: () => alert('Settings'), icon: '⚙️' },
  { id: '13', label: 'Extensions', description: 'Manage extensions', group: 'Tools', action: () => alert('Extensions'), icon: '🧩' },
  { id: '14', label: 'Command Palette', description: 'Show all commands', shortcut: '⌘⇧P', group: 'Tools', action: () => alert('Command Palette'), icon: '⌨️' },
  { id: '15', label: 'Terminal', description: 'Open terminal', shortcut: '⌘`', group: 'Tools', action: () => alert('Terminal'), icon: '💻' },
];

const meta: Meta<typeof CommandPalette> = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Default: Story = {
  args: {
    items: mockItems,
    placeholder: 'Type a command or search...',
    title: 'Command Palette',
    description: 'Press ⌘K to open',
  },
};

export const WithGroups: Story = {
  args: {
    items: mockItems,
    placeholder: 'Search commands...',
  },
};

export const Minimal: Story = {
  args: {
    items: mockItems.slice(0, 5),
    placeholder: 'Search...',
    title: undefined,
    description: undefined,
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <CommandPalette
        items={mockItems}
        open={open}
        onOpenChange={setOpen}
        placeholder="Controlled palette..."
      />
    );
  },
};

export const WithDisabledItems: Story = {
  args: {
    items: [
      ...mockItems.slice(0, 5),
      { id: 'disabled', label: 'Disabled Item', description: 'This item is disabled', group: 'File', action: () => {}, disabled: true },
      { id: '16', label: 'Another Item', description: 'This works', group: 'File', action: () => alert('Works') },
    ],
  },
};

export const WithCustomGroups: Story = {
  args: {
    items: [
      { id: '1', label: 'Deploy to Production', description: 'Deploy current build', shortcut: '⌘D', group: 'Deploy', action: () => alert('Deploy'), icon: '🚀' },
      { id: '2', label: 'Rollback', description: 'Rollback last deployment', shortcut: '⌘R', group: 'Deploy', action: () => alert('Rollback'), icon: '⏪' },
      { id: '3', label: 'View Logs', description: 'View deployment logs', group: 'Deploy', action: () => alert('Logs'), icon: '📋' },
      { id: '4', label: 'Run Tests', description: 'Run test suite', shortcut: '⌘T', group: 'CI/CD', action: () => alert('Tests'), icon: '🧪' },
      { id: '5', label: 'Build Docker', description: 'Build Docker image', group: 'CI/CD', action: () => alert('Build'), icon: '🐳' },
      { id: '6', label: 'Security Scan', description: 'Run security scan', group: 'Security', action: () => alert('Scan'), icon: '🔒' },
      { id: '7', label: 'Audit Dependencies', description: 'Check for vulnerabilities', group: 'Security', action: () => alert('Audit'), icon: '🔍' },
    ],
  },
};

export const LegalCommands: Story = {
  args: {
    items: [
      { id: '1', label: 'New Case', description: 'Create a new legal case', shortcut: '⌘N', group: 'Cases', action: () => alert('New Case'), icon: '📁' },
      { id: '2', label: 'Open Case', description: 'Open existing case', shortcut: '⌘O', group: 'Cases', action: () => alert('Open Case'), icon: '📂' },
      { id: '3', label: 'New Document', description: 'Create legal document', shortcut: '⌘D', group: 'Documents', action: () => alert('New Document'), icon: '📄' },
      { id: '4', label: 'Template Library', description: 'Browse templates', group: 'Documents', action: () => alert('Templates'), icon: '📚' },
      { id: '5', label: 'Client Search', description: 'Search clients', shortcut: '⌘K', group: 'Clients', action: () => alert('Search Clients'), icon: '🔍' },
      { id: '6', label: 'New Client', description: 'Add new client', group: 'Clients', action: () => alert('New Client'), icon: '👤' },
      { id: '7', label: 'Time Entry', description: 'Log billable hours', shortcut: '⌘T', group: 'Billing', action: () => alert('Time Entry'), icon: '⏱️' },
      { id: '8', label: 'Generate Invoice', description: 'Create invoice', group: 'Billing', action: () => alert('Invoice'), icon: '🧾' },
      { id: '9', label: 'Court Calendar', description: 'View court dates', group: 'Calendar', action: () => alert('Calendar'), icon: '📅' },
      { id: '10', label: 'Deadlines', description: 'View upcoming deadlines', group: 'Calendar', action: () => alert('Deadlines'), icon: '⏰' },
    ],
  },
};