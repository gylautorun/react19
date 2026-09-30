import * as tf from '@tensorflow/tfjs';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';

type Request = {
  id: number;
  temperature: number;
  vibration: number;
  current: number;
};

let trained: Promise<tf.Sequential> | undefined;

function syntheticRisk(
  temperature: number,
  vibration: number,
  current: number,
): number {
  return (
    temperature * 0.5 +
    vibration * 0.8 +
    current * 0.7 +
    vibration * current * 0.35
  );
}

async function trainModel(id: number): Promise<tf.Sequential> {
  setWasmPaths('/wasm/tfjs/');
  if (!(await tf.setBackend('wasm')))
    throw new Error('TensorFlow.js WASM 后端不可用');
  await tf.ready();

  const features: number[] = [];
  const labels: number[] = [];
  let seed = 1776;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let index = 0; index < 640; index++) {
    const temperature = random();
    const vibration = random();
    const current = random();
    features.push(temperature, vibration, current);
    labels.push(syntheticRisk(temperature, vibration, current) > 1.12 ? 1 : 0);
  }

  const inputs = tf.tensor2d(features, [640, 3]);
  const targets = tf.tensor2d(labels, [640, 1]);
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [3], units: 12, activation: 'relu' }),
  );
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(0.04), loss: 'binaryCrossentropy' });

  try {
    await model.fit(inputs, targets, {
      epochs: 28,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch) => {
          self.postMessage({
            id,
            kind: 'progress',
            progress: Math.round(((epoch + 1) / 28) * 100),
          });
        },
      },
    });
  } finally {
    inputs.dispose();
    targets.dispose();
  }

  return model;
}

self.onmessage = async ({ data }: MessageEvent<Request>) => {
  try {
    trained ??= trainModel(data.id);
    const model = await trained;
    const input = tf.tensor2d(
      [[data.temperature / 100, data.vibration / 10, data.current / 20]],
      [1, 3],
    );
    const start = performance.now();
    const prediction = model.predict(input) as tf.Tensor;
    const risk = (await prediction.data())[0];
    prediction.dispose();
    input.dispose();
    self.postMessage({
      id: data.id,
      kind: 'result',
      risk,
      elapsed: performance.now() - start,
    });
  } catch (error) {
    trained = undefined;
    self.postMessage({ id: data.id, kind: 'error', error: String(error) });
  }
};
