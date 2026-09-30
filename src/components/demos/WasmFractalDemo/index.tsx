'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import styles from './index.module.scss';

const width = 720;
const height = 450;
const initialView = { centerX: -0.7, centerY: 0, span: 3.4 };

type View = typeof initialView;
type Result = {
  id: number;
  pixels?: ArrayBuffer;
  elapsed?: number;
  error?: string;
};

export function WasmFractalDemo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [view, setView] = useState<View>(initialView);
  const [iterations, setIterations] = useState(120);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const instance = new Worker(
      new URL('../../../workers/fractal.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    worker.current = instance;
    instance.onmessage = ({ data }: MessageEvent<Result>) => {
      if (data.id !== requestId.current) return;
      if (data.error) {
        setError(data.error);
        return;
      }
      if (!data.pixels) return;
      canvas.current
        ?.getContext('2d')
        ?.putImageData(
          new ImageData(new Uint8ClampedArray(data.pixels), width, height),
          0,
          0,
        );
      setElapsed(data.elapsed ?? null);
      setError('');
    };
    instance.onerror = () => setError('计算线程启动失败');
    return () => {
      instance.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    worker.current?.postMessage({ id, width, height, ...view, iterations });
  }, [view, iterations]);

  function zoom(factor: number) {
    setView((current) => ({ ...current, span: current.span * factor }));
  }

  function zoomAt(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setView((current) => ({
      centerX: current.centerX + (x - 0.5) * current.span,
      centerY: current.centerY + (y - 0.5) * current.span * (height / width),
      span: current.span * 0.55,
    }));
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <div className={styles.presets}>
          <button type="button" onClick={() => setView(initialView)}>
            全景
          </button>
          <button
            type="button"
            onClick={() =>
              setView({ centerX: -0.7435, centerY: 0.1314, span: 0.012 })
            }
          >
            边界细节
          </button>
          <button
            type="button"
            onClick={() =>
              setView({ centerX: -1.255, centerY: 0.02, span: 0.2 })
            }
          >
            海马谷
          </button>
        </div>
        <label className={styles.iterations}>
          迭代 <strong>{iterations}</strong>
          <input
            type="range"
            min="40"
            max="280"
            step="20"
            value={iterations}
            onChange={(event) => setIterations(Number(event.target.value))}
          />
        </label>
        <div className={styles.zoom}>
          <button
            type="button"
            title="缩小"
            aria-label="缩小"
            onClick={() => zoom(1.7)}
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            title="放大"
            aria-label="放大"
            onClick={() => zoom(0.6)}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            title="重置视图"
            aria-label="重置视图"
            onClick={() => setView(initialView)}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <canvas
        ref={canvas}
        className={styles.canvas}
        width={width}
        height={height}
        onClick={zoomAt}
        aria-label="Mandelbrot 分形，点击放大所选区域"
      />
      <div className={styles.status} role="status">
        <span>
          中心 {view.centerX.toFixed(6)}, {view.centerY.toFixed(6)}
        </span>
        <span>视域 {view.span.toExponential(2)}</span>
        <span>
          {elapsed === null
            ? '计算中'
            : `Worker + WASM ${elapsed.toFixed(1)} ms`}
        </span>
        {error && <strong>{error}</strong>}
      </div>
    </div>
  );
}
