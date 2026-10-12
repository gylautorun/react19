import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Activity, Play, Square } from 'lucide-react';
import { onCLS, onINP, onLCP } from 'web-vitals/attribution';
import type {
  CLSMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
} from 'web-vitals';
import { calculateWorkload } from '../../../lib/interactionWorkload';
import styles from './index.module.scss';

type VitalsSnapshot = {
  inp?: INPMetricWithAttribution;
  lcp?: LCPMetricWithAttribution;
  cls?: CLSMetricWithAttribution;
};

const listeners = new Set<() => void>();
let vitalsSnapshot: VitalsSnapshot = {};
let observingVitals = false;

function publishMetric(metric: Partial<VitalsSnapshot>) {
  vitalsSnapshot = { ...vitalsSnapshot, ...metric };
  listeners.forEach((listener) => listener());
}

function subscribeVitals(listener: () => void) {
  listeners.add(listener);
  if (!observingVitals) {
    observingVitals = true;
    onINP((metric) => publishMetric({ inp: metric }), {
      reportAllChanges: true,
    });
    onLCP((metric) => publishMetric({ lcp: metric }), {
      reportAllChanges: true,
    });
    onCLS((metric) => publishMetric({ cls: metric }), {
      reportAllChanges: true,
    });
  }
  return () => listeners.delete(listener);
}

function getVitalsSnapshot() {
  return vitalsSnapshot;
}

const modes = [
  { value: 'blocking', label: '阻塞' },
  { value: 'yielding', label: '分片' },
  { value: 'worker', label: 'Worker' },
] as const;

type WorkMode = (typeof modes)[number]['value'];
type WorkResult = { duration: number; checksum: number; mode: WorkMode };
type LongFrame = { duration: number; blocking: number; source: string };

async function yieldToMain() {
  const scheduler = (
    globalThis as typeof globalThis & {
      scheduler?: { yield?: () => Promise<void> };
    }
  ).scheduler;
  if (scheduler?.yield) await scheduler.yield();
  else await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function diagnosis(metric?: INPMetricWithAttribution) {
  if (!metric) return '完成几次点击或键盘交互后，这里会显示最慢交互的归因。';
  const { inputDelay, processingDuration, presentationDelay } =
    metric.attribution;
  const longest = Math.max(inputDelay, processingDuration, presentationDelay);
  if (longest === inputDelay)
    return '输入等待占比最高：检查主线程长任务，将可并行计算移入 Worker。';
  if (longest === processingDuration)
    return '事件处理占比最高：拆分同步计算，缩短单次事件回调。';
  return '呈现延迟占比最高：检查布局、样式计算和绘制工作量。';
}

export function VitalsDemo() {
  const vitals = useSyncExternalStore(
    subscribeVitals,
    getVitalsSnapshot,
    getVitalsSnapshot,
  );
  const [mode, setMode] = useState<WorkMode>('blocking');
  const [millions, setMillions] = useState(4);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WorkResult | null>(null);
  const [error, setError] = useState('');
  const [probeCount, setProbeCount] = useState(0);
  const [frames, setFrames] = useState<LongFrame[]>([]);
  const jobId = useRef(0);
  const worker = useRef<Worker | null>(null);
  const cancelWorker = useRef<(() => void) | null>(null);

  useEffect(() => {
    const supported = PerformanceObserver.supportedEntryTypes?.includes(
      'long-animation-frame',
    );
    if (!supported) return;
    const observer = new PerformanceObserver((list) => {
      const next = list.getEntries().map((entry) => {
        const frame = entry as PerformanceEntry & {
          blockingDuration?: number;
          scripts?: { sourceURL?: string }[];
        };
        return {
          duration: frame.duration,
          blocking: frame.blockingDuration ?? 0,
          source: frame.scripts?.[0]?.sourceURL?.split('/').pop() ?? '主线程',
        };
      });
      setFrames((current) => [...next, ...current].slice(0, 5));
    });
    observer.observe({ type: 'long-animation-frame', buffered: true });
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      jobId.current += 1;
      cancelWorker.current?.();
      worker.current?.terminate();
    },
    [],
  );

  function stop() {
    jobId.current += 1;
    cancelWorker.current?.();
    cancelWorker.current = null;
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
  }

  async function run() {
    const currentJob = ++jobId.current;
    const iterations = millions * 1_000_000;
    const started = performance.now();
    setRunning(true);
    setResult(null);
    setError('');
    let instance: Worker | null = null;

    try {
      let checksum = 0;
      if (mode === 'blocking') {
        checksum = calculateWorkload(0, iterations);
      } else if (mode === 'yielding') {
        for (let index = 0; index < iterations; index += 50_000) {
          checksum += calculateWorkload(
            index,
            Math.min(index + 50_000, iterations),
          );
          if (currentJob !== jobId.current) return;
          await yieldToMain();
        }
      } else {
        const currentWorker = new Worker(
          new URL('../../../workers/interaction.ts', import.meta.url),
          { type: 'module' },
        );
        instance = currentWorker;
        worker.current = currentWorker;
        checksum = await new Promise<number>((resolve, reject) => {
          cancelWorker.current = () => reject(new Error('已停止'));
          currentWorker.onmessage = (
            event: MessageEvent<{ checksum: number }>,
          ) => resolve(event.data.checksum);
          currentWorker.onerror = () => reject(new Error('Worker 执行失败'));
          currentWorker.postMessage(iterations);
        });
      }

      if (currentJob === jobId.current) {
        setResult({ duration: performance.now() - started, checksum, mode });
      }
    } catch (failure) {
      if (currentJob === jobId.current) {
        setError(failure instanceof Error ? failure.message : '计算失败');
      }
    } finally {
      instance?.terminate();
      if (worker.current === instance) worker.current = null;
      if (currentJob === jobId.current) cancelWorker.current = null;
      if (currentJob === jobId.current) setRunning(false);
    }
  }

  const inp = vitals.inp;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>真实指标与交互负载</h2>
          <p>INP 由浏览器事件数据计算；任务耗时只表示这次计算的完成时间。</p>
        </div>
        <span className={styles.support}>INP 良好阈值 ≤ 200 ms</span>
      </div>
      <div className={styles['metric-grid']}>
        <div className={styles.metric}>
          <span>INP · 交互响应</span>
          <strong>{inp ? `${Math.round(inp.value)} ms` : '等待交互'}</strong>
          <small>{inp ? inp.rating : '点击或按键后采集'}</small>
        </div>
        <div className={styles.metric}>
          <span>LCP · 最大内容绘制</span>
          <strong>
            {vitals.lcp ? `${Math.round(vitals.lcp.value)} ms` : '采集中'}
          </strong>
          <small>{vitals.lcp?.rating ?? '页面加载指标'}</small>
        </div>
        <div className={styles.metric}>
          <span>CLS · 累计布局偏移</span>
          <strong>{vitals.cls ? vitals.cls.value.toFixed(3) : '采集中'}</strong>
          <small>{vitals.cls?.rating ?? '页面视觉稳定性'}</small>
        </div>
      </div>
      <div className={styles.split} style={{ marginTop: 24 }}>
        <div className={styles.controls}>
          <div className={styles.subheading}>负载生成器</div>
          <div className={styles.field}>
            <span>执行方式</span>
            <div
              className={styles.segmented}
              role="group"
              aria-label="执行方式"
            >
              {modes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  disabled={running}
                  onClick={() => setMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <label className={styles.field}>
            <span className={styles['field-top']}>
              计算规模 <strong>{millions} 百万次</strong>
            </span>
            <input
              type="range"
              min="1"
              max="20"
              value={millions}
              disabled={running}
              onChange={(event) => setMillions(Number(event.target.value))}
            />
          </label>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              disabled={running}
              onClick={run}
            >
              <Play size={14} /> 执行计算
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={!running || mode === 'blocking'}
              onClick={stop}
            >
              <Square size={13} /> 停止
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              onClick={() => setProbeCount((count) => count + 1)}
            >
              <Activity size={14} /> 响应探针 {probeCount}
            </button>
          </div>
          <div className={styles['result-line']} role="status">
            {error ||
              (running
                ? '计算中…'
                : result
                  ? `${result.mode} · ${Math.round(result.duration)} ms · 校验值 ${result.checksum.toFixed(2)}`
                  : '尚未执行计算')}
          </div>
        </div>
        <div className={styles.results}>
          <div className={styles.subheading}>INP 归因与长帧</div>
          <div className={styles.log}>
            <div className={styles['log-row']}>
              <span>输入等待</span>
              <strong>
                {inp ? `${Math.round(inp.attribution.inputDelay)} ms` : '—'}
              </strong>
            </div>
            <div className={styles['log-row']}>
              <span>事件处理</span>
              <strong>
                {inp
                  ? `${Math.round(inp.attribution.processingDuration)} ms`
                  : '—'}
              </strong>
            </div>
            <div className={styles['log-row']}>
              <span>绘制呈现</span>
              <strong>
                {inp
                  ? `${Math.round(inp.attribution.presentationDelay)} ms`
                  : '—'}
              </strong>
            </div>
            <div className={styles['log-row']}>
              <span>最慢目标</span>
              <strong>{inp?.attribution.interactionTarget || '—'}</strong>
            </div>
          </div>
          <p className={styles.note}>{diagnosis(inp)}</p>
          <div className={styles.subheading}>最近长动画帧</div>
          <div className={styles.log}>
            {frames.length ? (
              frames.map((frame, index) => (
                <div
                  className={styles['log-row']}
                  key={`${index}-${frame.duration}`}
                >
                  <span>{frame.source}</span>
                  <strong>
                    {Math.round(frame.duration)} ms · 阻塞{' '}
                    {Math.round(frame.blocking)} ms
                  </strong>
                </div>
              ))
            ) : (
              <div className={styles['log-row']}>
                <span>暂无长动画帧</span>
                <strong>—</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
