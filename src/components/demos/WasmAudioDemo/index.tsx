'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioLines, Play, Upload } from 'lucide-react';
import { loadLabWasm } from '../../../lib/wasm';
import styles from './index.module.scss';

const sampleRate = 8000;

function makeSignal(kind: 'tone' | 'sweep'): Int16Array {
  const samples = new Int16Array(sampleRate * 2);
  for (let index = 0; index < samples.length; index++) {
    const time = index / sampleRate;
    const frequency = kind === 'tone' ? 440 : 180 + 850 * (time / 2);
    const value =
      kind === 'tone'
        ? Math.sin(2 * Math.PI * frequency * time) * 0.48 +
          Math.sin(2 * Math.PI * 660 * time) * 0.22
        : Math.sin(2 * Math.PI * frequency * time) * 0.62;
    samples[index] = Math.round(value * 32767);
  }
  return samples;
}

export function WasmAudioDemo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [samples, setSamples] = useState(() => makeSignal('tone'));
  const [decoded, setDecoded] = useState<Int16Array | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLabWasm()
      .then((wasm) => {
        if (cancelled) return;
        const input = wasm.alloc(samples.byteLength);
        const packed = wasm.alloc(samples.length);
        const output = wasm.alloc(samples.byteLength);
        try {
          new Int16Array(wasm.memory.buffer, input, samples.length).set(
            samples,
          );
          const start = performance.now();
          wasm.encodeMuLaw(input, packed, samples.length);
          wasm.decodeMuLaw(packed, output, samples.length);
          const result = new Int16Array(
            new Int16Array(wasm.memory.buffer, output, samples.length),
          );
          setElapsed(performance.now() - start);
          setDecoded(result);
          setError('');
        } finally {
          wasm.release(input);
          wasm.release(packed);
          wasm.release(output);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(String(reason));
      });

    return () => {
      cancelled = true;
    };
  }, [samples]);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const width = context.canvas.width;
    const height = context.canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f5f8f8';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#dce6e6';
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    for (const [wave, color] of [
      [samples, '#157d72'],
      [decoded, '#da855b'],
    ] as const) {
      if (!wave) continue;
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.beginPath();
      for (let x = 0; x < width; x++) {
        const value = wave[Math.floor((x / width) * wave.length)] / 32768;
        const y = height / 2 - value * height * 0.37;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
  }, [samples, decoded]);

  async function loadAudio(file: File) {
    const context = new AudioContext();
    try {
      const audio = await context.decodeAudioData(await file.arrayBuffer());
      const channel = audio.getChannelData(0);
      const count = Math.min(
        sampleRate * 5,
        Math.floor((channel.length * sampleRate) / audio.sampleRate),
      );
      if (!count) throw new Error('音频为空');
      const next = new Int16Array(count);
      for (let index = 0; index < count; index++) {
        const value =
          channel[Math.floor((index * audio.sampleRate) / sampleRate)];
        next[index] = Math.round(Math.max(-1, Math.min(1, value)) * 32767);
      }
      setSamples(next);
      setDecoded(null);
      setError('');
    } catch {
      setError('无法解码该音频文件。');
    } finally {
      await context.close();
    }
  }

  async function play(wave: Int16Array) {
    const context = new AudioContext();
    setPlaying(true);
    try {
      const buffer = context.createBuffer(1, wave.length, sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < wave.length; index++)
        channel[index] = wave[index] / 32768;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
      });
    } finally {
      setPlaying(false);
      await context.close();
    }
  }

  const averageError = decoded
    ? decoded.reduce(
        (sum, value, index) => sum + Math.abs(value - samples[index]),
        0,
      ) / decoded.length
    : null;

  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <div className={styles.presets}>
          <button type="button" onClick={() => setSamples(makeSignal('tone'))}>
            双音样本
          </button>
          <button type="button" onClick={() => setSamples(makeSignal('sweep'))}>
            扫频样本
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="audio/*"
          className={styles.fileInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadAudio(file);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          className={styles.upload}
          onClick={() => fileInput.current?.click()}
        >
          <Upload size={15} /> 上传音频
        </button>
      </div>
      <div className={styles.wavePanel}>
        <div className={styles.waveHeading}>
          <span>
            <AudioLines size={16} /> 波形对照
          </span>
          <span>
            <i /> 原始 PCM <i /> μ-law 还原
          </span>
        </div>
        <canvas
          ref={canvas}
          width="900"
          height="240"
          aria-label="原始音频和还原音频的波形"
        />
      </div>
      <div className={styles.bottom}>
        <div className={styles.metrics} role="status">
          <span>
            <strong>{(samples.length / sampleRate).toFixed(1)} s</strong> 时长
          </span>
          <span>
            <strong>{(samples.byteLength / 1024).toFixed(1)} KiB</strong> PCM
          </span>
          <span>
            <strong>{(samples.length / 1024).toFixed(1)} KiB</strong> μ-law
          </span>
          <span>
            <strong>
              {averageError === null ? '—' : averageError.toFixed(0)}
            </strong>{' '}
            平均误差
          </span>
          <span>
            <strong>{elapsed === null ? '—' : elapsed.toFixed(2)} ms</strong>{' '}
            编解码
          </span>
        </div>
        <div className={styles.playback}>
          <button
            type="button"
            disabled={playing}
            onClick={() => void play(samples)}
          >
            <Play size={15} /> 原音
          </button>
          <button
            type="button"
            disabled={playing || !decoded}
            onClick={() => decoded && void play(decoded)}
          >
            <Play size={15} /> 还原音
          </button>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
