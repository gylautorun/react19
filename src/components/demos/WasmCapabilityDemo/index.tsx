'use client';

import { useEffect, useState } from 'react';
import { gc, simd, streamingCompilation, threads } from 'wasm-feature-detect';
import styles from './index.module.scss';

const probes = [
  {
    key: 'gc',
    label: 'WASM GC',
    check: gc,
    detail: '供 Kotlin/Wasm 等目标使用的托管对象能力',
  },
  {
    key: 'simd',
    label: 'SIMD',
    check: simd,
    detail: '像素、音频与矩阵运算的向量指令',
  },
  {
    key: 'threads',
    label: 'Threads',
    check: threads,
    detail: '共享内存线程；实际使用还需要跨源隔离',
  },
  {
    key: 'streaming',
    label: '流式编译',
    check: streamingCompilation,
    detail: '边下载边编译，服务端需提供正确 MIME 类型',
  },
] as const;

type ProbeKey = (typeof probes)[number]['key'];

export function WasmCapabilityDemo() {
  const [results, setResults] = useState<Partial<Record<ProbeKey, boolean>>>(
    {},
  );

  useEffect(() => {
    let active = true;
    void Promise.all(
      probes.map(async ({ key, check }) => [key, await check()] as const),
    ).then((values) => {
      if (active) setResults(Object.fromEntries(values));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.table}>
      {probes.map(({ key, label, detail }) => (
        <div className={styles.row} key={key}>
          <div>
            <strong>{label}</strong>
            <span>{detail}</span>
          </div>
          <output className={results[key] === false ? styles.unsupported : ''}>
            {results[key] === undefined
              ? '检测中'
              : results[key]
                ? '可用'
                : '不可用'}
          </output>
        </div>
      ))}
    </div>
  );
}
