'use client';

import { useLabStore } from '../store/useLabStore';

export function useTaskProgress() {
  const tasks = useLabStore((state) => state.tasks);
  const done = tasks.filter((task) => task.done).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return { tasks, done, percent };
}
