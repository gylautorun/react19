import { calculateWorkload } from '../lib/interactionWorkload';

self.onmessage = (event: MessageEvent<number>) => {
  const started = performance.now();
  const checksum = calculateWorkload(0, event.data);
  self.postMessage({ checksum, duration: performance.now() - started });
};
