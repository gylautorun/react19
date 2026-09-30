'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { loadLabWasm, withWasmBuffer } from '../../../lib/wasm';
import styles from './index.module.scss';

const modes = [
  { label: '灰度', value: 0 },
  { label: '反色', value: 1 },
  { label: '阈值', value: 2 },
];

function sampleImage(): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 440;
  const context = canvas.getContext('2d')!;
  const sky = context.createLinearGradient(0, 0, 720, 440);
  sky.addColorStop(0, '#d4e9ea');
  sky.addColorStop(0.55, '#f0d9b9');
  sky.addColorStop(1, '#dc9e72');
  context.fillStyle = sky;
  context.fillRect(0, 0, 720, 440);
  context.fillStyle = '#306a65';
  context.fillRect(0, 300, 720, 140);
  context.fillStyle = '#efc67e';
  context.beginPath();
  context.arc(525, 120, 69, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f4f0e4';
  context.fillRect(100, 215, 200, 150);
  context.fillStyle = '#ba624e';
  context.fillRect(122, 240, 48, 125);
  context.fillStyle = '#244b5d';
  context.fillRect(190, 245, 76, 120);
  context.fillStyle = '#153d3a';
  context.beginPath();
  context.moveTo(0, 300);
  context.lineTo(150, 175);
  context.lineTo(330, 300);
  context.fill();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function WasmImageDemo() {
  const sourceCanvas = useRef<HTMLCanvasElement>(null);
  const resultCanvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<ImageData | null>(null);
  const [mode, setMode] = useState(0);
  const [amount, setAmount] = useState(100);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSource(sampleImage()));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    sourceCanvas.current?.getContext('2d')?.putImageData(source, 0, 0);

    loadLabWasm()
      .then((wasm) => {
        if (cancelled) return;
        const start = performance.now();
        const bytes = withWasmBuffer(
          wasm,
          source.data.byteLength,
          (pointer) => {
            new Uint8Array(
              wasm.memory.buffer,
              pointer,
              source.data.byteLength,
            ).set(source.data);
            wasm.filterImage(
              pointer,
              source.width * source.height,
              mode,
              amount,
            );
            return new Uint8ClampedArray(
              new Uint8Array(
                wasm.memory.buffer,
                pointer,
                source.data.byteLength,
              ),
            );
          },
        );
        resultCanvas.current
          ?.getContext('2d')
          ?.putImageData(
            new ImageData(bytes, source.width, source.height),
            0,
            0,
          );
        setElapsed(performance.now() - start);
        setError('');
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(String(reason));
      });

    return () => {
      cancelled = true;
    };
  }, [source, mode, amount]);

  async function loadFile(file: File) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 900 / bitmap.width, 700 / bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      setSource(context.getImageData(0, 0, canvas.width, canvas.height));
      setError('');
    } catch {
      setError('无法读取此图片，请换一个文件。');
    }
  }

  function download() {
    const canvas = resultCanvas.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'wasm-filter.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} aria-label="滤镜类型">
          {modes.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={mode === item.value}
              onClick={() => setMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className={styles.amount}>
          {mode === 2 ? '阈值' : '强度'} <strong>{amount}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </label>
        <div className={styles.actions}>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadFile(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            title="上传图片"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus size={16} /> 上传
          </button>
          <button
            type="button"
            title="下载处理结果"
            disabled={!source}
            onClick={download}
          >
            <Download size={16} /> 导出
          </button>
        </div>
      </div>
      <div className={styles.canvases}>
        <div className={styles.canvasPane}>
          <div className={styles.paneHeading}>原图</div>
          <canvas
            ref={sourceCanvas}
            width={source?.width ?? 720}
            height={source?.height ?? 440}
          />
        </div>
        <div className={styles.canvasPane}>
          <div className={styles.paneHeading}>WASM 处理结果</div>
          <canvas
            ref={resultCanvas}
            width={source?.width ?? 720}
            height={source?.height ?? 440}
          />
        </div>
      </div>
      <div className={styles.status} role="status">
        <span>
          {source
            ? `${source.width} × ${source.height} · ${source.data.byteLength.toLocaleString()} 字节 RGBA`
            : '加载中'}
        </span>
        <span>
          {elapsed === null
            ? '等待计算'
            : `拷贝 + WASM 运算 ${elapsed.toFixed(2)} ms`}
        </span>
        {error && <strong>{error}</strong>}
      </div>
    </div>
  );
}
