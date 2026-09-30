import { loadLabWasm } from '../lib/wasm';

type Request = {
  id: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  span: number;
  iterations: number;
};

self.onmessage = async ({ data }: MessageEvent<Request>) => {
  try {
    const wasm = await loadLabWasm();
    const pointer = wasm.alloc(data.width * data.height * 4);
    try {
      const start = performance.now();
      wasm.renderFractal(
        pointer,
        data.width,
        data.height,
        data.centerX,
        data.centerY,
        data.span,
        data.iterations,
      );
      const pixels = new Uint8ClampedArray(
        new Uint8Array(
          wasm.memory.buffer,
          pointer,
          data.width * data.height * 4,
        ),
      );
      self.postMessage(
        {
          id: data.id,
          pixels: pixels.buffer,
          elapsed: performance.now() - start,
        },
        { transfer: [pixels.buffer] },
      );
    } finally {
      wasm.release(pointer);
    }
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) });
  }
};
