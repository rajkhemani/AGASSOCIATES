import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './modal';
import { Button } from './button';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Modal',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const ModalDemo = ({ children, title, description, ...props }: React.ComponentProps<typeof DialogContent>) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{props.triggerLabel || 'Open Modal'}</Button>
      </DialogTrigger>
      <DialogContent {...props}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const Default: Story = {
  render: () => (
    <ModalDemo title="Default Modal" description="This is a basic modal dialog">
      <p>Modal content goes here.</p>
    </ModalDemo>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalDemo
      title="Edit Profile"
      description="Make changes to your profile below."
      triggerLabel="Edit Profile"
    >
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            defaultValue="John Doe"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            defaultValue="john@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            defaultValue="Software developer"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
          />
        </div>
      </div>
    </ModalDemo>
  ),
};

export const Confirmation: Story = {
  render: () => (
    <ModalDemo
      title="Delete Account"
      description="Are you sure you want to delete your account? This action cannot be undone."
      triggerLabel="Delete Account"
    >
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => alert('Cancelled')}>Cancel</Button>
        <Button variant="destructive" onClick={() => alert('Deleted')}>Delete</Button>
      </div>
    </ModalDemo>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalDemo
      title="Large Modal"
      description="This modal has a larger max width for more content"
      triggerLabel="Open Large Modal"
      className="max-w-2xl"
    >
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-semibold">Section 1</h3>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        <h3 className="text-lg font-semibold">Section 2</h3>
        <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <h3 className="text-lg font-semibold">Section 3</h3>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
      </div>
    </ModalDemo>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalDemo
      title="Small Modal"
      description="A compact modal for simple confirmations"
      triggerLabel="Open Small Modal"
      className="max-w-sm"
    >
      <p className="mt-4">This is a small modal with limited content.</p>
    </ModalDemo>
  ),
};

export const NoTitle: Story = {
  render: () => (
    <ModalDemo
      title=""
      description=""
      triggerLabel="Open Modal Without Title"
    >
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold">Success!</h3>
        <p className="mt-2 text-muted-foreground">Your changes have been saved.</p>
        <Button className="mt-6" onClick={() => alert('Closed')}>Continue</Button>
      </div>
    </ModalDemo>
  ),
};

export const Nested: Story = {
  render: () => {
    const [outerOpen, setOuterOpen] = useState(false);
    const [innerOpen, setInnerOpen] = useState(false);
    return (
      <Dialog open={outerOpen} onOpenChange={setOuterOpen}>
        <DialogTrigger asChild>
          <Button>Open Outer Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Outer Modal</DialogTitle>
            <DialogDescription>This modal contains another modal</DialogTitle>
          </DialogHeader>
          <p className="mt-4">Click the button below to open a nested modal.</p>
          <Dialog open={innerOpen} onOpenChange={setInnerOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">Open Inner Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inner Modal</DialogTitle>
                <DialogDescription>This is a nested modal</DialogTitle>
              </DialogHeader>
              <p className="mt-4">Nested modal content goes here.</p>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  },
};