import { SkeletonList } from './Skeleton';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message = 'Loading...', rows = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={message}>
      <SkeletonList rows={rows} />
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}
