'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { BookOpen, CircleHelp, ThumbsUp } from 'lucide-react';
import { voteReaction } from '../../../server/actions';
import styles from './index.module.scss';

type Reaction = 'helpful' | 'examples' | 'unclear';
type Counts = Record<Reaction, number>;

const options = [
  { id: 'helpful', label: '有帮助', icon: ThumbsUp },
  { id: 'examples', label: '需要更多示例', icon: BookOpen },
  { id: 'unclear', label: '仍有疑问', icon: CircleHelp },
] as const;

export function OptimisticDemo({
  initialReactions,
}: {
  initialReactions: Counts;
}) {
  const [counts, setCounts] = useState(initialReactions);
  const [optimistic, addOptimistic] = useOptimistic(
    counts,
    (current, kind: Reaction) => ({
      ...current,
      [kind]: current[kind] + 1,
    }),
  );
  const [pending, startTransition] = useTransition();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [message, setMessage] = useState('');
  const total = Object.values(optimistic).reduce(
    (sum, value) => sum + value,
    0,
  );

  function vote(kind: Reaction) {
    setMessage('');
    startTransition(async () => {
      addOptimistic(kind);
      try {
        setCounts(await voteReaction(kind, simulateFailure));
        setMessage('服务端已确认投票。');
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : '提交失败，乐观结果已回退。',
        );
      }
    });
  }

  return (
    <div className={styles['vote-surface']}>
      <div className={styles.heading}>
        <div>
          <span className={styles['micro-label']}>社区反馈</span>
          <h3>哪个部分最值得继续深入？</h3>
        </div>
        <span>{total} 次选择</span>
      </div>
      <div className={styles['reaction-list']}>
        {options.map(({ id, label, icon: Icon }) => (
          <div className={styles['reaction-row']} key={id}>
            <button type="button" onClick={() => vote(id)} disabled={pending}>
              <Icon size={15} /> {label}
            </button>
            <div className={styles['reaction-track']} aria-hidden="true">
              <span
                style={{
                  width: `${total ? (optimistic[id] / total) * 100 : 0}%`,
                }}
              />
            </div>
            <strong>{optimistic[id]}</strong>
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <label>
          <input
            type="checkbox"
            checked={simulateFailure}
            disabled={pending}
            onChange={(event) => setSimulateFailure(event.target.checked)}
          />{' '}
          模拟服务端失败
        </label>
        <span role="status">{pending ? '正在同步服务端...' : message}</span>
      </div>
    </div>
  );
}
