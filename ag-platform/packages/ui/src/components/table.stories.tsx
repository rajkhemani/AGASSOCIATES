import type { Meta, StoryObj } from '@storybook/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './table';
import { Badge } from './badge';

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active', lastLogin: '1 day ago' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'pending', lastLogin: 'Never' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Admin', status: 'completed', lastLogin: '5 min ago' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Editor', status: 'failed', lastLogin: '1 week ago' },
];

const statusBadges = {
  active: <Badge variant="active">Active</Badge>,
  pending: <Badge variant="pending">Pending</Badge>,
  completed: <Badge variant="completed">Completed</Badge>,
  failed: <Badge variant="destructive">Failed</Badge>,
};

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Last Login</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{statusBadges[row.status as keyof typeof statusBadges]}</TableCell>
            <TableCell className="text-right">{row.lastLogin}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>User management table with sortable columns</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{statusBadges[row.status as keyof typeof statusBadges]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
            No data available
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Striped: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }, (_, i) => (
          <TableRow key={i}>
            <TableCell>{i + 1}</TableCell>
            <TableCell className="font-medium">Product {i + 1}</TableCell>
            <TableCell>Description for product {i + 1}</TableCell>
            <TableCell>${(Math.random() * 100).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockData.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>{statusBadges[row.status as keyof typeof statusBadges]}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
                <button className="text-sm text-muted-foreground hover:text-red-500">Delete</button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Dense: Story = {
  render: () => (
    <div className="text-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 15 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>{new Date(Date.now() - i * 86400000).toLocaleDateString()}</TableCell>
              <TableCell>Transaction {i + 1}</TableCell>
              <TableCell className={i % 2 === 0 ? 'text-green-600' : 'text-red-600'}>
                {i % 2 === 0 ? '+' : '-'}${Math.floor(Math.random() * 1000)}
              </TableCell>
              <TableCell>${(Math.random() * 10000).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { item: 'Product A', qty: 2, price: 29.99 },
          { item: 'Product B', qty: 1, price: 49.99 },
          { item: 'Product C', qty: 3, price: 19.99 },
        ].map((row, i) => (
          <TableRow key={i}>
            <TableCell>{row.item}</TableCell>
            <TableCell className="text-right">{row.qty}</TableCell>
            <TableCell className="text-right">${row.price.toFixed(2)}</TableCell>
            <TableCell className="text-right font-medium">${(row.qty * row.price).toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableCaption className="text-right font-semibold">Grand Total: $189.94</TableCaption>
    </Table>
  ),
};