import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import styles from './index.module.scss';

const shader = `
struct Params {
  width: u32,
  height: u32,
  maxIterations: u32,
  padding: u32,
  zoom: f32,
  centerX: f32,
  centerY: f32,
  padding2: f32,
}
@group(0) @binding(0) var<storage, read_write> counts: array<u32>;
@group(0) @binding(1) var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.width || id.y >= params.height) { return; }
  let cx = (f32(id.x) / f32(params.width) - 0.5) * 3.2 / params.zoom + params.centerX;
  let cy = (f32(id.y) / f32(params.height) - 0.5) * 3.2 / params.zoom + params.centerY;
  var zx = 0.0;
  var zy = 0.0;
  var iteration = 0u;
  loop {
    if (iteration >= params.maxIterations || zx * zx + zy * zy > 4.0) { break; }
    let nextX = zx * zx - zy * zy + cx;
    zy = 2.0 * zx * zy + cy;
    zx = nextX;
    iteration += 1u;
  }
  counts[id.y * params.width + id.x] = iteration;
}
`;

type Engine = 'gpu' | 'cpu';
type Palette = 'ocean' | 'ember' | 'mono';
type Center = { x: number; y: number };
type GpuContext = { device: GPUDevice; pipeline: GPUComputePipeline };
type Output = {
  counts: Uint32Array;
  resolution: number;
  iterations: number;
  duration: number;
  engine: Engine;
};

const initialCenter: Center = { x: -0.5, y: 0 };
const initialResolution = 256;
const initialIterations = 160;
const minZoom = 0.25;
const maxZoom = 16;
const zoomStep = 1.7;

function cpuCompute(
  resolution: number,
  iterations: number,
  center: Center,
  zoom: number,
) {
  const counts = new Uint32Array(resolution * resolution);
  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const cx = ((x / resolution - 0.5) * 3.2) / zoom + center.x;
      const cy = ((y / resolution - 0.5) * 3.2) / zoom + center.y;
      let zx = 0;
      let zy = 0;
      let count = 0;
      while (count < iterations && zx * zx + zy * zy <= 4) {
        const nextX = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = nextX;
        count += 1;
      }
      counts[y * resolution + x] = count;
    }
  }
  return counts;
}

async function gpuCompute(
  context: GpuContext,
  resolution: number,
  iterations: number,
  center: Center,
  zoom: number,
) {
  const { device, pipeline } = context;
  const byteLength = resolution * resolution * Uint32Array.BYTES_PER_ELEMENT;
  const output = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const readback = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const uniform = device.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  try {
    const settings = new ArrayBuffer(32);
    const view = new DataView(settings);
    view.setUint32(0, resolution, true);
    view.setUint32(4, resolution, true);
    view.setUint32(8, iterations, true);
    view.setFloat32(16, zoom, true);
    view.setFloat32(20, center.x, true);
    view.setFloat32(24, center.y, true);
    device.queue.writeBuffer(uniform, 0, settings);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: output } },
        { binding: 1, resource: { buffer: uniform } },
      ],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(resolution / 8),
      Math.ceil(resolution / 8),
    );
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, byteLength);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const counts = new Uint32Array(readback.getMappedRange().slice(0));
    readback.unmap();
    return counts;
  } finally {
    output.destroy();
    readback.destroy();
    uniform.destroy();
  }
}

function drawOutput(
  canvas: HTMLCanvasElement,
  output: Output,
  palette: Palette,
) {
  const { resolution, counts, iterations } = output;
  canvas.width = resolution;
  canvas.height = resolution;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(resolution, resolution);
  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index];
    const offset = index * 4;
    if (count >= iterations) {
      image.data[offset] = 21;
      image.data[offset + 1] = 35;
      image.data[offset + 2] = 40;
    } else {
      const wave = Math.sin(count * 0.15) * 0.5 + 0.5;
      if (palette === 'ocean') {
        image.data[offset] = 28 + wave * 86;
        image.data[offset + 1] = 99 + wave * 145;
        image.data[offset + 2] = 121 + wave * 118;
      } else if (palette === 'ember') {
        image.data[offset] = 135 + wave * 115;
        image.data[offset + 1] = 58 + wave * 161;
        image.data[offset + 2] = 30 + wave * 82;
      } else {
        const gray = 45 + wave * 195;
        image.data[offset] = gray;
        image.data[offset + 1] = gray;
        image.data[offset + 2] = gray;
      }
    }
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

export function WebGpuDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRef = useRef<GpuContext | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [adapterName, setAdapterName] = useState('检测中');
  const [engine, setEngine] = useState<Engine>('gpu');
  const [resolution, setResolution] = useState(initialResolution);
  const [iterations, setIterations] = useState(initialIterations);
  const [palette, setPalette] = useState<Palette>('ocean');
  const [center, setCenter] = useState<Center>(initialCenter);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(true);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function initialize() {
      let device: GPUDevice | null = null;
      try {
        const adapter = await navigator.gpu?.requestAdapter();
        if (!adapter) throw new Error('未取得 GPU adapter');
        device = await adapter.requestDevice();
        const module = device.createShaderModule({ code: shader });
        const compilation = await module.getCompilationInfo();
        const shaderError = compilation.messages.find(
          (message) => message.type === 'error',
        );
        if (shaderError) throw new Error(shaderError.message);
        const pipeline = await device.createComputePipelineAsync({
          layout: 'auto',
          compute: { module, entryPoint: 'main' },
        });
        if (!active) {
          device.destroy();
          return;
        }
        gpuRef.current = { device, pipeline };
        setAdapterName(adapter.info?.vendor || '可用 GPU');
        setSupported(true);
        const started = performance.now();
        const counts = await gpuCompute(
          { device, pipeline },
          initialResolution,
          initialIterations,
          initialCenter,
          1,
        );
        if (active) {
          setOutput({
            counts,
            resolution: initialResolution,
            iterations: initialIterations,
            duration: performance.now() - started,
            engine: 'gpu',
          });
        }
      } catch {
        if (active) {
          device?.destroy();
          gpuRef.current = null;
          setSupported(false);
          setEngine('cpu');
          setAdapterName('CPU 降级');
          const started = performance.now();
          const counts = cpuCompute(
            initialResolution,
            initialIterations,
            initialCenter,
            1,
          );
          setOutput({
            counts,
            resolution: initialResolution,
            iterations: initialIterations,
            duration: performance.now() - started,
            engine: 'cpu',
          });
        }
      } finally {
        if (active) setBusy(false);
      }
    }
    void initialize();
    return () => {
      active = false;
      gpuRef.current?.device.destroy();
      gpuRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (output && canvasRef.current)
      drawOutput(canvasRef.current, output, palette);
  }, [output, palette]);

  async function run(nextCenter = center, nextZoom = zoom) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const started = performance.now();
      const actualEngine = engine === 'gpu' && gpuRef.current ? 'gpu' : 'cpu';
      const counts =
        actualEngine === 'gpu' && gpuRef.current
          ? await gpuCompute(
              gpuRef.current,
              resolution,
              iterations,
              nextCenter,
              nextZoom,
            )
          : cpuCompute(resolution, iterations, nextCenter, nextZoom);
      setOutput({
        counts,
        resolution,
        iterations,
        duration: performance.now() - started,
        engine: actualEngine,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '计算失败');
    } finally {
      setBusy(false);
    }
  }

  function handleCanvasClick(event: MouseEvent<HTMLCanvasElement>) {
    if (busy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextCenter = {
      x:
        center.x +
        (((event.clientX - rect.left) / rect.width - 0.5) * 3.2) / zoom,
      y:
        center.y +
        (((event.clientY - rect.top) / rect.height - 0.5) * 3.2) / zoom,
    };
    const nextZoom = Math.min(maxZoom, zoom * zoomStep);
    setCenter(nextCenter);
    setZoom(nextZoom);
    void run(nextCenter, nextZoom);
  }

  function zoomCenter(direction: 'in' | 'out') {
    if (busy) return;
    const nextZoom =
      direction === 'in'
        ? Math.min(maxZoom, zoom * zoomStep)
        : Math.max(minZoom, zoom / zoomStep);
    if (nextZoom === zoom) return;
    setZoom(nextZoom);
    void run(center, nextZoom);
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>WebGPU 计算着色器</h2>
          <p>同一组 Mandelbrot 参数分别交给 GPU compute shader 或 CPU 计算。</p>
        </div>
        <span
          className={styles.support}
          data-supported={String(supported === true)}
        >
          {supported === null
            ? '检测中'
            : supported
              ? 'WebGPU 可用'
              : 'CPU 降级'}
        </span>
      </div>
      <div className={styles.split}>
        <div className={styles.controls}>
          <div className={styles.subheading}>计算参数</div>
          <div className={styles.field}>
            <span>执行引擎</span>
            <div
              className={[styles.segmented, styles['two-options']].join(' ')}
              role="group"
              aria-label="执行引擎"
            >
              <button
                type="button"
                aria-pressed={engine === 'gpu'}
                disabled={!supported || busy}
                onClick={() => setEngine('gpu')}
              >
                GPU
              </button>
              <button
                type="button"
                aria-pressed={engine === 'cpu'}
                disabled={busy}
                onClick={() => setEngine('cpu')}
              >
                CPU
              </button>
            </div>
          </div>
          <label className={styles.field}>
            分辨率
            <select
              value={resolution}
              disabled={busy}
              onChange={(event) => setResolution(Number(event.target.value))}
            >
              <option value="128">128 × 128</option>
              <option value="256">256 × 256</option>
              <option value="512">512 × 512</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles['field-top']}>
              最大迭代 <strong>{iterations}</strong>
            </span>
            <input
              type="range"
              min="64"
              max="384"
              step="32"
              value={iterations}
              disabled={busy}
              onChange={(event) => setIterations(Number(event.target.value))}
            />
          </label>
          <label className={styles.field}>
            调色
            <select
              value={palette}
              onChange={(event) => setPalette(event.target.value as Palette)}
            >
              <option value="ocean">青蓝</option>
              <option value="ember">赤金</option>
              <option value="mono">灰阶</option>
            </select>
          </label>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              disabled={busy || supported === null}
              onClick={() => void run()}
            >
              <Play size={14} /> 生成图像
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={busy}
              onClick={() => {
                const initial = { x: -0.5, y: 0 };
                setCenter(initial);
                setZoom(1);
                void run(initial, 1);
              }}
            >
              <RotateCcw size={14} /> 重置视角
            </button>
          </div>
          <div className={styles.log}>
            <div className={styles['log-row']}>
              <span>Adapter</span>
              <strong>{adapterName}</strong>
            </div>
            <div className={styles['log-row']}>
              <span>中心 / 缩放</span>
              <strong>
                {center.x.toFixed(3)}, {center.y.toFixed(3)} / {zoom.toFixed(1)}
                ×
              </strong>
            </div>
            <div className={styles['log-row']}>
              <span>计算与读回</span>
              <strong>
                {output
                  ? `${output.engine.toUpperCase()} · ${Math.round(output.duration)} ms`
                  : '尚未生成'}
              </strong>
            </div>
          </div>
          {error && <p className={styles.warning}>{error}</p>}
        </div>
        <div className={styles.results}>
          <div className={styles.subheading}>Mandelbrot 输出</div>
          <div
            className={styles['zoom-controls']}
            role="group"
            aria-label="图像缩放"
          >
            <button
              type="button"
              title="缩小图像"
              aria-label="缩小图像"
              disabled={busy || zoom <= minZoom}
              onClick={() => zoomCenter('out')}
            >
              <ZoomOut size={16} />
            </button>
            <output aria-live="polite">{zoom.toFixed(2)}×</output>
            <button
              type="button"
              title="放大图像"
              aria-label="放大图像"
              disabled={busy || zoom >= maxZoom}
              onClick={() => zoomCenter('in')}
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width="256"
            height="256"
            role="button"
            tabIndex={0}
            aria-label="Mandelbrot 分形图像，点击定位并放大；按 Enter 在中心放大"
            onClick={handleCanvasClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                zoomCenter('in');
              }
            }}
          />
          <p className={styles.note}>
            耗时包含 GPU 缓冲区读回，不代表纯 GPU
            运算时间。首次管线编译在计时前完成； CPU 与 GPU
            的数值可能因浮点精度略有不同。
          </p>
        </div>
      </div>
    </section>
  );
}
