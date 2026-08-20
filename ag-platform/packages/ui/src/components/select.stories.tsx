import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const SelectDemo = ({ children, ...props }: React.ComponentProps<typeof Select>) => {
  return (
    <Select defaultValue="option1" {...props}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const Default: Story = {
  render: () => <SelectDemo />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-64">
      <label className="block text-sm font-medium mb-1">Select Option</label>
      <SelectDemo />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select defaultValue="option1" disabled>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithManyOptions: Story = {
  render: () => (
    <Select defaultValue="react">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
        <SelectItem value="angular">Angular</SelectItem>
        <SelectItem value="svelte">Svelte</SelectItem>
        <SelectItem value="solid">Solid</SelectItem>
        <SelectItem value="qwik">Qwik</SelectItem>
        <SelectItem value="astro">Astro</SelectItem>
        <SelectItem value="next">Next.js</SelectItem>
        <SelectItem value="nuxt">Nuxt</SelectItem>
        <SelectItem value="remix">Remix</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select defaultValue="javascript">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="javascript">JavaScript</SelectItem>
        <SelectItem value="typescript">TypeScript</SelectItem>
        <SelectItem value="python">Python</SelectItem>
        <SelectItem value="rust">Rust</SelectItem>
        <SelectItem value="go">Go</SelectItem>
        <SelectItem value="java">Java</SelectItem>
        <SelectItem value="csharp">C#</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Required: Story = {
  render: () => (
    <Select required defaultValue="">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select required option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('option1');
    return (
      <div className="space-y-2 w-64">
        <Select value={value} onValueChange={setValue} defaultValue="option1">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Selected: {value}</p>
      </div>
    );
  },
};