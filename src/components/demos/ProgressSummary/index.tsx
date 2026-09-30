'use client';
import { useTaskProgress } from '../../../hooks/useTaskProgress';

export function ProgressSummary() {
  const { tasks, done } = useTaskProgress();
  return (
    <span>
      <strong>
        {done}/{tasks.length}
      </strong>{' '}
      清单进度
    </span>
  );
}
