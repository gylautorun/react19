'use client';

import { useDeferredValue, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { records } from '../../../constants/records';
import styles from './index.module.scss';

type SortMode = 'recent' | 'latency' | 'name';
const pageSize = 12;

export function ConcurrentDemo() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [group, setGroup] = useState('全部地区');
  const [status, setStatus] = useState('全部状态');
  const [sort, setSort] = useState<SortMode>('recent');
  const [limit, setLimit] = useState(6000);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const filtered = records
    .slice(0, limit)
    .filter(
      (item) =>
        (group === '全部地区' || item.group === group) &&
        (status === '全部状态' || item.status === status) &&
        (item.name.includes(deferredQuery) ||
          item.group.includes(deferredQuery) ||
          String(item.id).includes(deferredQuery)),
    )
    .sort((left, right) => {
      if (sort === 'latency') return right.latency - left.latency;
      if (sort === 'name') return left.name.localeCompare(right.name, 'zh-CN');
      return right.id - left.id;
    });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const abnormal = filtered.filter((item) => item.status === '异常').length;
  const averageLatency = filtered.length
    ? Math.round(
        filtered.reduce((sum, item) => sum + item.latency, 0) / filtered.length,
      )
    : 0;
  const stale = query !== deferredQuery || pending;

  function updateFilter(change: () => void) {
    startTransition(() => {
      change();
      setPage(1);
    });
  }

  return (
    <div
      className={[styles['surface'], styles['concurrent-surface']].join(' ')}
    >
      <div className={styles['demo-toolbar']}>
        <div className={styles['search-field']}>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="搜索类型、地区或编号..."
            aria-label="筛选数据"
          />
        </div>
        <div className={styles['segmented']} aria-label="数据规模">
          {[2000, 6000, 12000].map((size) => (
            <button
              type="button"
              key={size}
              className={limit === size ? styles.selected : undefined}
              onClick={() => updateFilter(() => setLimit(size))}
            >
              {size / 1000}k
            </button>
          ))}
        </div>
      </div>
      <div className={styles['facet-row']}>
        <label>
          地区
          <select
            value={group}
            onChange={(event) =>
              updateFilter(() => setGroup(event.target.value))
            }
          >
            <option>全部地区</option>
            <option>华东</option>
            <option>华南</option>
            <option>华北</option>
            <option>西部</option>
          </select>
        </label>
        <label>
          状态
          <select
            value={status}
            onChange={(event) =>
              updateFilter(() => setStatus(event.target.value))
            }
          >
            <option>全部状态</option>
            <option>正常</option>
            <option>待审核</option>
            <option>异常</option>
          </select>
        </label>
        <label>
          排序
          <select
            value={sort}
            onChange={(event) =>
              updateFilter(() => setSort(event.target.value as SortMode))
            }
          >
            <option value="recent">最新记录</option>
            <option value="latency">耗时最高</option>
            <option value="name">名称</option>
          </select>
        </label>
      </div>
      <div className={styles['summary-row']}>
        <span>
          <strong>{filtered.length.toLocaleString('zh-CN')}</strong> 匹配
        </span>
        <span>
          <strong>{abnormal}</strong> 异常
        </span>
        <span>
          <strong>{averageLatency} ms</strong> 平均耗时
        </span>
      </div>
      <div className={styles['list-heading']}>
        <strong>结果预览</strong>
        <span>
          {stale ? '更新中...' : `第 ${currentPage} / ${pageCount} 页`}
        </span>
      </div>
      <div
        className={[styles['data-list'], stale && styles.stale]
          .filter(Boolean)
          .join(' ')}
      >
        {visible.map((item) => (
          <div className={styles['data-row']} key={item.id}>
            <span>#{String(item.id).padStart(5, '0')}</span>
            <strong>{item.name}</strong>
            <small>{item.group}</small>
            <em
              className={
                item.status === '异常' ? styles['status-alert'] : undefined
              }
            >
              {item.status}
            </em>
            <b>{item.latency} ms</b>
          </div>
        ))}
        {!filtered.length && (
          <p className={styles['empty-state']}>暂无匹配数据</p>
        )}
      </div>
      <div className={styles['list-footer']}>
        <span>
          输入值：<code>{query || '空'}</code> · 延后值：
          <code>{deferredQuery || '空'}</code>
        </span>
        <div className={styles.pagination}>
          <button
            type="button"
            aria-label="上一页"
            title="上一页"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="下一页"
            title="下一页"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
