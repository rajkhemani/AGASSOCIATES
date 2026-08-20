import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SplitView } from './split-view';

const meta: Meta<typeof SplitView> = {
  title: 'Components/SplitView',
  component: SplitView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SplitView>;

export const Horizontal: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[50, 50]} className="h-96">
      <SplitView.Pane className="bg-blue-500/20 p-4">
        <h3 className="font-medium">Left Pane</h3>
        <p className="text-sm text-muted-foreground mt-2">This is the left pane content</p>
      </SplitView.Pane>
      <SplitView.Pane className="bg-green-500/20 p-4">
        <h3 className="font-medium">Right Pane</h3>
        <p className="text-sm text-muted-foreground mt-2">This is the right pane content</p>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const Vertical: Story = {
  render: () => (
    <SplitView direction="vertical" sizes={[50, 50]} className="h-96">
      <SplitView.Pane className="bg-blue-500/20 p-4">
        <h3 className="font-medium">Top Pane</h3>
        <p className="text-sm text-muted-foreground mt-2">This is the top pane content</p>
      </SplitView.Pane>
      <SplitView.Pane className="bg-green-500/20 p-4">
        <h3 className="font-medium">Bottom Pane</h3>
        <p className="text-sm text-muted-foreground mt-2">This is the bottom pane content</p>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const ThreePane: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[30, 40, 30]} className="h-96">
      <SplitView.Pane className="bg-blue-500/20 p-4">
        <h3 className="font-medium">Left (30%)</h3>
      </SplitView.Pane>
      <SplitView.Pane className="bg-green-500/20 p-4">
        <h3 className="font-medium">Center (40%)</h3>
      </SplitView.Pane>
      <SplitView.Pane className="bg-purple-500/20 p-4">
        <h3 className="font-medium">Right (30%)</h3>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const WithCollapse: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <SplitView
        direction="horizontal"
        sizes={[50, 50]}
        collapsed={[false, collapsed]}
        onCollapseChange={(index, value) => index === 1 && setCollapsed(value)}
        className="h-96"
      >
        <SplitView.Pane className="bg-blue-500/20 p-4" collapsible>
          <h3 className="font-medium">Main Content</h3>
          <p className="text-sm text-muted-foreground mt-2">This pane cannot be collapsed</p>
        </SplitView.Pane>
        <SplitView.Pane className="bg-green-500/20 p-4" collapsible defaultCollapsed={collapsed}>
          <h3 className="font-medium">Sidebar</h3>
          <p className="text-sm text-muted-foreground mt-2">This pane can be collapsed</p>
        </SplitView.Pane>
      </SplitView>
    );
  },
};

export const UnevenSizes: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[20, 80]} className="h-96">
      <SplitView.Pane className="bg-blue-500/20 p-4">
        <h3 className="font-medium">Narrow (20%)</h3>
      </SplitView.Pane>
      <SplitView.Pane className="bg-green-500/20 p-4">
        <h3 className="font-medium">Wide (80%)</h3>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const WithMinMax: Story = {
  render: () => (
    <SplitView
      direction="horizontal"
      sizes={[30, 70]}
      minSizes={[100, 200]}
      maxSizes={[400, '100%']}
      className="h-96"
    >
      <SplitView.Pane className="bg-blue-500/20 p-4" minSize={100} maxSize={400}>
        <h3 className="font-medium">Constrained (100-400px)</h3>
      </SplitView.Pane>
      <SplitView.Pane className="bg-green-500/20 p-4" minSize={200}>
        <h3 className="font-medium">Min 200px</h3>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const Nested: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[30, 70]} className="h-96">
      <SplitView.Pane className="bg-blue-500/20 p-4">
        <h3 className="font-medium">Sidebar</h3>
      </SplitView.Pane>
      <SplitView.Pane className="p-0">
        <SplitView direction="vertical" sizes={[50, 50]} className="h-full">
          <SplitView.Pane className="bg-green-500/20 p-4">
            <h3 className="font-medium">Top Content</h3>
          </SplitView.Pane>
          <SplitView.Pane className="bg-purple-500/20 p-4">
            <h3 className="font-medium">Bottom Content</h3>
          </SplitView.Pane>
        </SplitView>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const CodeEditorLayout: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[25, 50, 25]} className="h-96">
      <SplitView.Pane className="bg-slate-900 p-4">
        <h3 className="font-medium text-green-400">File Explorer</h3>
        <ul className="mt-4 space-y-1 text-sm text-slate-300">
          <li>src/</li>
          <li>├── components/</li>
          <li>│   ├── button.tsx</li>
          <li>│   └── input.tsx</li>
          <li>├── hooks/</li>
          <li>└── utils/</li>
        </ul>
      </SplitView.Pane>
      <SplitView.Pane className="bg-slate-950 p-4 font-mono text-sm text-green-300">
        <h3 className="font-medium text-green-400 mb-2">button.tsx</h3>
        <pre>{`export function Button({ children }) {
  return (
    <button className="btn">
      {children}
    </button>
  );
}`}
        </pre>
      </SplitView.Pane>
      <SplitView.Pane className="bg-slate-800 p-4">
        <h3 className="font-medium text-blue-400">Terminal</h3>
        <pre className="mt-4 text-sm text-slate-300 font-mono">{`$ npm run dev
> dev
> vite

  VITE v5.0.0  ready in 300ms

  ➜  Local:   http://localhost:5173
  ➜  Network: http://192.168.1.5:5173`}
        </pre>
      </SplitView.Pane>
    </SplitView>
  ),
};

export const WithContent: Story = {
  render: () => (
    <SplitView direction="horizontal" sizes={[30, 70]} className="h-96">
      <SplitView.Pane className="bg-muted/50 p-4 overflow-y-auto">
        <h3 className="font-medium mb-4">Navigation</h3>
        <nav className="space-y-2">
          {['Dashboard', 'Projects', 'Tasks', 'Calendar', 'Settings', 'Reports'].map((item) => (
            <button key={item} className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm">
              {item}
            </button>
          ))}
        </nav>
      </SplitView.Pane>
      <SplitView.Pane className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {['Total Users', 'Active Projects', 'Completed Tasks', 'Revenue'].map((stat) => (
            <div key={stat} className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{stat}</p>
              <p className="text-3xl font-bold mt-1">{Math.floor(Math.random() * 10000)}</p>
            </div>
          ))}
        </div>
      </SplitView.Pane>
    </SplitView>
  ),
};