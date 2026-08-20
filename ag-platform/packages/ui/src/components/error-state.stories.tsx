import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState, ErrorStateCard, InlineError } from './error-state';
import { Button } from './button';

const meta: Meta<typeof ErrorState> = {
  title: 'Components/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  args: {},
};

export const WithCustomMessage: Story = {
  args: {
    title: 'Failed to Load',
    message: 'Unable to fetch data. Please check your connection.',
    onRetry: () => alert('Retry clicked'),
  },
};

export const NetworkError: Story = {
  args: {
    variant: 'network',
    onRetry: () => alert('Retrying...'),
  },
};

export const ServerError: Story = {
  args: {
    variant: 'server',
    title: 'Server Error',
    message: 'Our servers are experiencing issues. Please try again later.',
    onRetry: () => alert('Retrying...'),
  },
};

export const NotFound: Story = {
  args: {
    variant: 'not-found',
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
  },
};

export const PermissionError: Story = {
  args: {
    variant: 'permission',
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
  },
};

export const WithCustomAction: Story = {
  args: {
    title: 'Something went wrong',
    message: 'We encountered an unexpected error.',
    onRetry: () => alert('Retry'),
    action: <Button variant="outline" onClick={() => alert('Support clicked')}>Contact Support</Button>,
  },
};

export const CardVariant: Story = {
  render: () => (
    <ErrorStateCard
      title="Failed to Load Data"
      message="Unable to fetch the requested data. Please try again."
      onRetry={() => alert('Retry')}
    />
  ),
};

export const CardNetworkError: Story = {
  render: () => (
    <ErrorStateCard variant="network" onRetry={() => alert('Retry')} />
  ),
};

export const InlineErrorDefault: Story = {
  render: () => (
    <InlineError message="This field is required" onDismiss={() => alert('Dismissed')} />
  ),
};

export const InlineErrorWithDismiss: Story = {
  render: () => (
    <div className="space-y-2 w-96">
      <InlineError message="Email address is invalid" onDismiss={() => alert('Dismissed')} />
      <InlineError message="Password must be at least 8 characters" />
      <InlineError message="Username is already taken" onDismiss={() => alert('Dismissed')} />
    </div>
  ),
};

export const FormError: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full rounded-md border border-red-500 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
          placeholder="Enter email"
        />
        <InlineError message="Please enter a valid email address" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full rounded-md border border-red-500 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
          placeholder="Enter password"
        />
        <InlineError message="Password must be at least 8 characters" />
      </div>
      <Button>Submit</Button>
    </div>
  ),
};

export const MultipleErrors: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <ErrorState
        title="Multiple Errors"
        message="Several issues need to be resolved"
        action={
          <Button variant="outline" onClick={() => alert('View all errors')}>
            View All Errors
          </Button>
        }
      />
      <div className="space-y-2">
        <InlineError message="Invalid email format" onDismiss={() => {}} />
        <InlineError message="Password too weak" onDismiss={() => {}} />
        <InlineError message="Username already taken" onDismiss={() => {}} />
      </div>
    </div>
  ),
};

export const WithCustomIcon: Story = {
  args: {
    title: 'Custom Error',
    message: 'This error uses a custom configuration',
    // Custom icons would be passed via props in a real implementation
  },
};