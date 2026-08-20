import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonList, SkeletonCard, SkeletonTable } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <SkeletonCard />
  ),
};

export const CardWithTitle: Story = {
  render: () => (
    <SkeletonCard title description actions={2} />
  ),
};

export const List: Story = {
  render: () => (
    <SkeletonList rows={5} />
  ),
};

export const Table: Story = {
  render: () => (
    <SkeletonTable rows={5} columns={4} />
  ),
};

export const Circle: Story = {
  render: () => (
    <div className="flex gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-24 w-24 rounded-full" />
    </div>
  ),
};

export const Rectangle: Story = {
  render: () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  ),
};

export const AvatarList: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  ),
};

export const ButtonSkeleton: Story = {
  render: () => (
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-24 rounded-md" />
    </div>
  ),
};

export const FormSkeleton: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    </div>
  ),
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={5} columns={4} />
    </div>
  ),
};