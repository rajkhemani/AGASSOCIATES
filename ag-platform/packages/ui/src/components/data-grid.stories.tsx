import type { Meta, StoryObj } from '@storybook/react';
import { DataGrid } from './data-grid';
import { Badge } from './badge';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info: any) => {
      const status = info.getValue();
      const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'pending' | 'active' | 'completed'> = {
        active: 'active',
        pending: 'pending',
        completed: 'completed',
        failed: 'destructive',
      };
      return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: (info: any) => info.getValue(),
  },
];

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'Admin', lastLogin: '2 hours ago' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active', role: 'Editor', lastLogin: '1 day ago' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'pending', role: 'Viewer', lastLogin: 'Never' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', status: 'completed', role: 'Admin', lastLogin: '5 min ago' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', status: 'failed', role: 'Editor', lastLogin: '1 week ago' },
  { id: '6', name: 'Diana Prince', email: 'diana@example.com', status: 'active', role: 'Viewer', lastLogin: '3 hours ago' },
  { id: '7', name: 'Edward Norton', email: 'edward@example.com', status: 'pending', role: 'Admin', lastLogin: 'Never' },
  { id: '8', name: 'Fiona Apple', email: 'fiona@example.com', status: 'completed', role: 'Editor', lastLogin: '2 days ago' },
  { id: '9', name: 'George Lucas', email: 'george@example.com', status: 'active', role: 'Viewer', lastLogin: '1 hour ago' },
  { id: '10', name: 'Hannah Montana', email: 'hannah@example.com', status: 'failed', role: 'Admin', lastLogin: '3 days ago' },
  { id: '11', name: 'Ian Fleming', email: 'ian@example.com', status: 'pending', role: 'Editor', lastLogin: 'Never' },
  { id: '12', name: 'Julia Roberts', email: 'julia@example.com', status: 'completed', role: 'Viewer', lastLogin: '5 hours ago' },
];

const meta: Meta<typeof DataGrid> = {
  title: 'Components/DataGrid',
  component: DataGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataGrid>;

export const Default: Story = {
  args: {
    data: mockData,
    columns,
    searchable: true,
    filterable: true,
    paginated: true,
    pageSize: 5,
  },
};

export const Selectable: Story = {
  args: {
    data: mockData,
    columns,
    selectable: true,
    onSelectionChange: (selected) => console.log('Selected:', selected),
    searchable: true,
    paginated: true,
    pageSize: 5,
  },
};

export const WithActions: Story = {
  args: {
    data: mockData.map((item, i) => ({
      ...item,
      actions: (
        <div className="flex gap-1">
          <button className="p-1 text-muted-foreground hover:text-foreground" title="Edit">✏️</button>
          <button className="p-1 text-muted-foreground hover:text-foreground" title="Delete">🗑️</button>
        </div>
      ),
    })),
    columns: [
      ...columns,
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: (info: any) => info.getValue(),
      },
    ],
    searchable: true,
    paginated: true,
    pageSize: 5,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
    searchable: false,
    paginated: false,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyMessage: 'No users found',
    searchable: false,
    paginated: false,
  },
};

export const ServerSidePagination: Story = {
  args: {
    data: mockData.slice(0, 5),
    columns,
    paginated: true,
    pageSize: 5,
    pageCount: 3,
    onPageChange: (page) => console.log('Page changed to:', page),
    onPageSizeChange: (size) => console.log('Page size changed to:', size),
    searchable: true,
  },
};

export const Minimal: Story = {
  args: {
    data: mockData.slice(0, 3),
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'status', header: 'Status' },
    ],
    searchable: false,
    filterable: false,
    paginated: false,
  },
};