'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import styles from './index.module.scss';

type WorkerResponse = {
  id: number;
  kind: 'progress' | 'result' | 'error';
  progress?: number;
  risk?: number;
  elapsed?: number;
  error?: string;
};

const safeSample = { temperature: 35, vibration: 1, current: 4 };
const riskySample = { temperature: 90, vibration: 8, current: 16 };

export function WasmAiDemo() {
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [readings, setReadings] = useState(safeSample);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('模型尚未训练');
  const [risk, setRisk] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const instance = new Worker(
      new URL('../../../workers/anomaly.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    worker.current = instance;
    instance.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.id !== requestId.current) return;
      if (data.kind === 'progress') {
        setStatus(`本地训练 ${data.progress ?? 0}%`);
      } else if (data.kind === 'error') {
        setBusy(false);
        setStatus(data.error ?? '推理失败');
      } else {
        setRisk(data.risk ?? null);
        setElapsed(data.elapsed ?? null);
        setStatus('WASM 推理完成');
        setBusy(false);
      }
    };
    instance.onerror = () => {
      setBusy(false);
      setStatus('推理线程启动失败');
    };
    return () => {
      instance.terminate();
      worker.current = null;
    };
  }, []);

  function infer() {
    if (!worker.current) return;
    setBusy(true);
    setRisk(null);
    setElapsed(null);
    setStatus('准备 TensorFlow.js WASM 后端…');
    worker.current.postMessage({ id: ++requestId.current, ...readings });
  }

  const sliders = [
    { key: 'temperature', label: '温度', unit: '°C', min: 20, max: 100 },
    { key: 'vibration', label: '振动', unit: 'mm/s', min: 0, max: 10 },
    { key: 'current', label: '电流', unit: 'A', min: 0, max: 20 },
  ] as const;

  return (
    <div className={styles.tool}>
      <div className={styles.editor}>
        <div className={styles.heading}>设备读数</div>
        {sliders.map(({ key, label, unit, min, max }) => (
          <label className={styles.slider} key={key}>
            <span>
              {label}
              <strong>
                {readings[key]} {unit}
              </strong>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              value={readings[key]}
              onChange={(event) =>
                setReadings((current) => ({
                  ...current,
                  [key]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
        <div className={styles.samples}>
          <button type="button" onClick={() => setReadings(safeSample)}>
            常规样本
          </button>
          <button type="button" onClick={() => setReadings(riskySample)}>
            异常样本
          </button>
        </div>
      </div>
      <div className={styles.result}>
        <div className={styles.heading}>异常风险</div>
        <div className={styles.risk} aria-live="polite">
          {risk === null ? (
            <span className={styles.empty}>等待推理结果</span>
          ) : (
            <>
              <strong>{(risk * 100).toFixed(1)}%</strong>
              <span>{risk >= 0.5 ? '异常' : '正常'}</span>
            </>
          )}
        </div>
        <div className={styles.meter}>
          <span style={{ width: `${(risk ?? 0) * 100}%` }} />
        </div>
        <div className={styles.footer}>
          <span role="status">{status}</span>
          {elapsed !== null && <small>推理 {elapsed.toFixed(1)} ms</small>}
        </div>
        <button
          className={styles.run}
          type="button"
          disabled={busy}
          onClick={infer}
        >
          <Play size={15} /> {busy ? '运行中…' : '运行推理'}
        </button>
      </div>
    </div>
  );
}
