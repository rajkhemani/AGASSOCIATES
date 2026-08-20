import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    hint: 'Must be at least 8 characters',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    error: true,
    errorMessage: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'John Doe',
    required: true,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    defaultValue: 'johndoe',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '25',
    min: 0,
    max: 120,
  },
};

export const SearchInput: Story = {
  args: {
    placeholder: 'Search...',
    type: 'search',
    'aria-label': 'Search',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input label="Default" placeholder="Enter text..." />
      <Input label="With Hint" placeholder="Enter text..." hint="Helper text" />
      <Input label="With Value" defaultValue="Pre-filled value" />
      <Input label="Error State" placeholder="Enter email" error errorMessage="Invalid email" defaultValue="invalid" />
      <Input label="Disabled" placeholder="Cannot edit" disabled />
      <Input label="Required" placeholder="Required field" required />
    </div>
  ),
};