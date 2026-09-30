'use client';
import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useTaskProgress } from '../../../hooks/useTaskProgress';
import { useLabStore } from '../../../store/useLabStore';
import styles from './index.module.scss';

export function StoreDemo() {
  const { tasks, done, percent } = useTaskProgress();
  const addTask = useLabStore((state) => state.addTask);
  const toggleTask = useLabStore((state) => state.toggleTask);
  const removeTask = useLabStore((state) => state.removeTask);
  const [title, setTitle] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim());
    setTitle('');
  }
  return (
    <div className={styles['store-layout']}>
      <div className={[styles['surface'], styles['task-surface']].join(' ')}>
        <form className={styles['task-form']} onSubmit={submit}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="添加学习任务..."
            aria-label="添加学习任务"
            maxLength={80}
          />
          <button className={styles['primary-button']} type="submit">
            <Plus size={17} /> 添加
          </button>
        </form>
        <div className={styles['task-list']}>
          {tasks.map((task) => (
            <div className={styles['task-row']} key={task.id}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span className={styles['custom-check']}>
                  {task.done && <Check size={14} />}
                </span>
                <span className={task.done ? styles['done'] : undefined}>
                  {task.title}
                </span>
              </label>
              <button
                className={styles['icon-button']}
                title={`删除${task.title}`}
                aria-label={`删除${task.title}`}
                onClick={() => removeTask(task.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!tasks.length && (
            <p className={styles['empty-state']}>还没有任务，添加第一项吧。</p>
          )}
        </div>
      </div>
      <div className={styles['progress-panel']}>
        <span className={styles['micro-label']}>学习进度</span>
        <strong>
          {percent}
          <small>%</small>
        </strong>
        <div className={styles['progress-track']}>
          <span
            style={{
              width: `${percent}%`,
            }}
          />
        </div>
        <p>
          已完成 {done} 项 · 共 {tasks.length} 项
        </p>
        <a href="/">返回概览查看共享进度 →</a>
      </div>
    </div>
  );
}
