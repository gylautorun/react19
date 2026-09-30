'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { Plus } from 'lucide-react';
import styles from './index.module.scss';

type Variant = 'raw' | 'manual' | 'compiler';
type Options = { label: string; threshold: number };

function createCommitStore() {
  let counts: Record<Variant, number> = { raw: 0, manual: 0, compiler: 0 };
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(variant: Variant) {
      return counts[variant];
    },
    record(variant: Variant) {
      counts = { ...counts, [variant]: counts[variant] + 1 };
      listeners.forEach((listener) => listener());
    },
  };
}

type CommitStore = ReturnType<typeof createCommitStore>;

function CommitCount({
  store,
  variant,
}: {
  store: CommitStore;
  variant: Variant;
}) {
  return useSyncExternalStore(
    store.subscribe,
    () => store.get(variant),
    () => 0,
  );
}

const MemoPreview = memo(function MemoPreview({
  options,
  selected,
  onToggle,
  store,
  variant,
}: {
  options: Options;
  selected: boolean;
  onToggle: () => void;
  store: CommitStore;
  variant: Variant;
}) {
  useEffect(() => {
    store.record(variant);
  });

  return (
    <label className={styles['preview-row']}>
      <input type="checkbox" checked={selected} onChange={onToggle} />
      <span>
        <strong>{options.label}</strong>
        <small>库存低于 {options.threshold} 件时通知</small>
      </span>
    </label>
  );
});

function CasePanel({
  variant,
  title,
  detail,
  tick,
  store,
  options,
  selected,
  onToggle,
}: {
  variant: Variant;
  title: string;
  detail: string;
  tick: number;
  store: CommitStore;
  options: Options;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={[styles.case, styles[variant]].join(' ')}>
      <div className={styles['case-heading']}>
        <span>{title}</span>
        <strong>
          <CommitCount store={store} variant={variant} />
          <small>次子组件提交</small>
        </strong>
      </div>
      <p>{detail}</p>
      <MemoPreview
        options={options}
        selected={selected}
        onToggle={onToggle}
        store={store}
        variant={variant}
      />
      <div className={styles['parent-state']}>父组件计数：{tick}</div>
    </div>
  );
}

function RawCase({ tick, store }: { tick: number; store: CommitStore }) {
  'use no memo';

  const [selected, setSelected] = useState(false);
  const options = { label: '库存提醒', threshold: 24 };
  const onToggle = () => setSelected((value) => !value);

  return (
    <CasePanel
      variant="raw"
      title="未缓存"
      detail="每次更新都会产生新的对象和函数引用。"
      tick={tick}
      store={store}
      options={options}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function ManualCase({ tick, store }: { tick: number; store: CommitStore }) {
  'use no memo';

  const [selected, setSelected] = useState(false);
  const options = useMemo(() => ({ label: '库存提醒', threshold: 24 }), []);
  const onToggle = useCallback(() => setSelected((value) => !value), []);

  return (
    <CasePanel
      variant="manual"
      title="手动缓存"
      detail="useMemo 稳定对象，useCallback 稳定函数。"
      tick={tick}
      store={store}
      options={options}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

function CompilerCase({ tick, store }: { tick: number; store: CommitStore }) {
  const [selected, setSelected] = useState(false);
  const options = { label: '库存提醒', threshold: 24 };
  const onToggle = () => setSelected((value) => !value);

  return (
    <CasePanel
      variant="compiler"
      title="React Compiler"
      detail="没有手写缓存 Hook，编译器处理稳定引用。"
      tick={tick}
      store={store}
      options={options}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

export function CompilerIdentityDemo() {
  const [tick, setTick] = useState(0);
  const [store] = useState(createCommitStore);

  return (
    <div className={styles.surface}>
      <div className={styles.toolbar}>
        <span>
          无关状态 <strong>{tick}</strong>
        </span>
        <button type="button" onClick={() => setTick((value) => value + 1)}>
          <Plus size={16} /> 更新计数
        </button>
      </div>
      <div className={styles['case-grid']}>
        <RawCase tick={tick} store={store} />
        <ManualCase tick={tick} store={store} />
        <CompilerCase tick={tick} store={store} />
      </div>
    </div>
  );
}
