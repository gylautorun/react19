import { useEffect, useState, useSyncExternalStore } from 'react';
import { Database, RefreshCw, Save, Trash2 } from 'lucide-react';
import styles from './index.module.scss';

type BucketHandle = {
  indexedDB: IDBFactory;
  estimate?: () => Promise<StorageEstimate>;
  persist?: () => Promise<boolean>;
};

type BucketManager = {
  open: (name: string, options?: { expires?: number }) => Promise<BucketHandle>;
  keys?: () => Promise<string[]>;
  delete: (name: string) => Promise<void>;
};

function getBucketManager() {
  return (navigator as Navigator & { storageBuckets?: BucketManager })
    .storageBuckets;
}

const subscribeStatic = () => () => {};

function openDatabase(factory: IDBFactory) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('browser-platform-notes', 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('notes')) {
        database.createObjectStore('notes');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeNote(factory: IDBFactory, value: string) {
  const database = await openDatabase(factory);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('notes', 'readwrite');
      transaction.objectStore('notes').put(value, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

async function readNote(factory: IDBFactory) {
  const database = await openDatabase(factory);
  try {
    return await new Promise<string | undefined>((resolve, reject) => {
      const transaction = database.transaction('notes', 'readonly');
      const request = transaction.objectStore('notes').get('current');
      request.onsuccess = () => resolve(request.result as string | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

function deleteFallbackDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('browser-platform-notes');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('数据库仍被其他页面使用'));
  });
}

function formatBytes(value?: number) {
  if (value === undefined) return '未知';
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}

export function StorageDemo() {
  const supported = useSyncExternalStore(
    subscribeStatic,
    () => Boolean(getBucketManager()),
    () => null,
  );
  const [bucketName, setBucketName] = useState('lab-cache');
  const [expiresIn, setExpiresIn] = useState(7);
  const [note, setNote] = useState('组件资源与离线记录');
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [bucketNames, setBucketNames] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [status, setStatus] = useState('尚未写入');
  const [busy, setBusy] = useState(false);

  async function refresh(name = bucketName, inspectBucket = false) {
    const manager = getBucketManager();
    if (manager) {
      setBucketNames((await manager.keys?.()) ?? []);
      if (inspectBucket) {
        const bucket = await manager.open(name);
        setEstimate((await bucket.estimate?.()) ?? null);
      } else setEstimate((await navigator.storage?.estimate?.()) ?? null);
    } else {
      setEstimate((await navigator.storage?.estimate?.()) ?? null);
    }
  }

  useEffect(() => {
    let active = true;
    const manager = getBucketManager();
    void Promise.all([
      manager?.keys?.() ?? Promise.resolve([]),
      navigator.storage?.estimate?.() ?? Promise.resolve(null),
    ])
      .then(([names, usage]) => {
        if (!active) return;
        setBucketNames(names);
        setEstimate(usage);
      })
      .catch((error: unknown) => {
        if (active)
          setStatus(error instanceof Error ? error.message : '存储检测失败');
      });
    return () => {
      active = false;
    };
  }, []);

  async function perform(action: 'save' | 'read' | 'delete' | 'persist') {
    if (!/^[a-z0-9-]{1,30}$/.test(bucketName)) {
      setStatus('桶名称需要 1–30 位小写字母、数字或连字符');
      return;
    }
    setBusy(true);
    try {
      const manager = getBucketManager();
      if (action === 'delete') {
        if (manager) await manager.delete(bucketName);
        else await deleteFallbackDatabase();
        setSavedNote(null);
        setStatus(`${bucketName} 已删除`);
      } else {
        const bucket = manager
          ? await manager.open(
              bucketName,
              action === 'save'
                ? { expires: Date.now() + expiresIn * 86_400_000 }
                : undefined,
            )
          : null;
        const factory = bucket?.indexedDB ?? indexedDB;
        if (action === 'save') {
          await writeNote(factory, note);
          setSavedNote(note);
          setStatus('记录已写入 IndexedDB');
        } else if (action === 'read') {
          const value = await readNote(factory);
          setSavedNote(value ?? null);
          setStatus(value === undefined ? '当前桶没有记录' : '已从存储读取');
        } else {
          const persisted = await (bucket?.persist?.() ??
            navigator.storage.persist());
          setStatus(persisted ? '持久化请求已获准' : '持久化请求未获准');
        }
      }
      await refresh(bucketName, action !== 'delete');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '存储操作失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>Storage Buckets</h2>
          <p>按用途隔离 IndexedDB 数据，查看配额并申请持久化。</p>
        </div>
        <span
          className={styles.support}
          data-supported={String(supported === true)}
        >
          {supported === null
            ? '检测中'
            : supported
              ? 'Storage Buckets 可用'
              : '普通 IndexedDB 降级'}
        </span>
      </div>
      <div className={styles.split}>
        <div className={styles.controls}>
          <div className={styles.subheading}>存储配置</div>
          <label className={styles.field}>
            桶名称
            <input
              value={bucketName}
              maxLength={30}
              onChange={(event) => setBucketName(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles['field-top']}>
              期望有效期 <strong>{expiresIn} 天</strong>
            </span>
            <input
              type="range"
              min="1"
              max="30"
              value={expiresIn}
              disabled={!supported}
              onChange={(event) => setExpiresIn(Number(event.target.value))}
            />
          </label>
          <label className={styles.field}>
            记录内容
            <textarea
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              disabled={busy}
              onClick={() => void perform('save')}
            >
              <Save size={14} /> 写入
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={busy}
              onClick={() => void perform('read')}
            >
              <Database size={14} /> 读取
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={busy}
              onClick={() => void perform('delete')}
            >
              <Trash2 size={14} /> 删除
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={busy}
              onClick={() => void perform('persist')}
            >
              <RefreshCw size={14} /> 持久化
            </button>
          </div>
          <div className={styles['result-line']} role="status">
            {status}
          </div>
        </div>
        <div className={styles.results}>
          <div className={styles.subheading}>当前存储状态</div>
          <div className={styles.log}>
            <div className={styles['log-row']}>
              <span>已用空间</span>
              <strong>{formatBytes(estimate?.usage)}</strong>
            </div>
            <div className={styles['log-row']}>
              <span>可用配额估算</span>
              <strong>{formatBytes(estimate?.quota)}</strong>
            </div>
            <div className={styles['log-row']}>
              <span>现有桶</span>
              <strong>
                {supported ? bucketNames.join('、') || '无' : '不适用'}
              </strong>
            </div>
            <div className={styles['log-row']}>
              <span>读取结果</span>
              <strong>{savedNote ?? '无记录'}</strong>
            </div>
          </div>
          <p className={styles.warning}>
            到期时间与持久化都是浏览器策略请求，并非保存保证。普通 IndexedDB
            降级模式没有桶隔离与桶过期能力。
          </p>
        </div>
      </div>
    </section>
  );
}
