'use client';

import { create } from 'zustand';

type Task = { id: number; title: string; done: boolean };
type LabStore = {
  tasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (id: number) => void;
  removeTask: (id: number) => void;
};

export const useLabStore = create<LabStore>((set) => ({
  tasks: [
    { id: 1, title: '体验 React Compiler 示例', done: true },
    { id: 2, title: '观察 RSC 流式加载', done: false },
    { id: 3, title: '提交一个 Server Action', done: false },
  ],
  addTask: (title) =>
    set((state) => ({
      tasks: [...state.tasks, { id: Date.now(), title, done: false }],
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    })),
  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
}));
