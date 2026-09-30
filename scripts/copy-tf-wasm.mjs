import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = [
  'tfjs-backend-wasm.wasm',
  'tfjs-backend-wasm-simd.wasm',
  'tfjs-backend-wasm-threaded-simd.wasm',
];
const source = new URL(
  '../node_modules/@tensorflow/tfjs-backend-wasm/dist/',
  import.meta.url,
);
const destination = new URL('../public/wasm/tfjs/', import.meta.url);

await mkdir(destination, { recursive: true });
await Promise.all(
  files.map((file) =>
    copyFile(
      fileURLToPath(new URL(file, source)),
      fileURLToPath(new URL(file, destination)),
    ),
  ),
);
