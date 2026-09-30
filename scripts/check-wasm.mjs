import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const binary = await readFile('public/wasm/lab.wasm');
const { instance } = await WebAssembly.instantiate(binary, {
  env: {
    abort: () => {
      throw new Error('WASM aborted');
    },
  },
});
const wasm = instance.exports;

const image = wasm.alloc(4);
new Uint8Array(wasm.memory.buffer, image, 4).set([255, 0, 0, 255]);
wasm.filterImage(image, 1, 0, 100);
assert.deepEqual(
  [...new Uint8Array(wasm.memory.buffer, image, 4)],
  [76, 76, 76, 255],
);
wasm.release(image);

const pcm = wasm.alloc(4);
const packed = wasm.alloc(2);
const restored = wasm.alloc(4);
new Int16Array(wasm.memory.buffer, pcm, 2).set([10000, -10000]);
wasm.encodeMuLaw(pcm, packed, 2);
wasm.decodeMuLaw(packed, restored, 2);
const values = [...new Int16Array(wasm.memory.buffer, restored, 2)];
assert.ok(Math.abs(values[0] - 10000) < 300, `positive sample: ${values[0]}`);
assert.ok(Math.abs(values[1] + 10000) < 300, `negative sample: ${values[1]}`);
wasm.release(pcm);
wasm.release(packed);
wasm.release(restored);

const fractal = wasm.alloc(64 * 40 * 4);
wasm.renderFractal(fractal, 64, 40, -0.7, 0, 3.4, 80);
const pixels = new Uint8Array(wasm.memory.buffer, fractal, 64 * 40 * 4);
assert.ok(new Set(pixels.filter((_, index) => index % 4 === 0)).size > 10);
wasm.release(fractal);

console.log('WASM image, audio and fractal checks passed.');
