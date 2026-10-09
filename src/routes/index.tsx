import type { ReactNode } from 'react';
import { ActionPage } from '../pages/ActionPage';
import { CompilerPage } from '../pages/CompilerPage';
import { ConcurrentPage } from '../pages/ConcurrentPage';
import { HooksPage } from '../pages/HooksPage';
import { OverviewPage } from '../pages/OverviewPage';
import { RscPage } from '../pages/RscPage';
import { StorePage } from '../pages/StorePage';
import { WebComponentsPage } from '../pages/WebComponentsPage';
import { WasmAiPage } from '../pages/WasmAiPage';
import { WasmAudioPage } from '../pages/WasmAudioPage';
import { WasmFractalPage } from '../pages/WasmFractalPage';
import { WasmImagePage } from '../pages/WasmImagePage';
import { WasmRuntimePage } from '../pages/WasmRuntimePage';
import styles from './index.module.scss';

type RouteDefinition = {
  title: string;
  render: (url: URL) => ReactNode;
};

const routes: Record<string, RouteDefinition> = {
  '/': { title: '概览', render: () => <OverviewPage /> },
  '/compiler': { title: 'React Compiler', render: () => <CompilerPage /> },
  '/rsc': {
    title: 'Server Components',
    render: (url) => <RscPage url={url} />,
  },
  '/actions': { title: 'Server Actions', render: () => <ActionPage /> },
  '/hooks': { title: '异步 Hooks', render: () => <HooksPage /> },
  '/concurrent': { title: '并发渲染', render: () => <ConcurrentPage /> },
  '/store': { title: 'Zustand 状态管理', render: () => <StorePage /> },
  '/web-components': {
    title: 'Web Components',
    render: () => <WebComponentsPage />,
  },
  '/wasm/image': { title: 'WASM 图片处理', render: () => <WasmImagePage /> },
  '/wasm/audio': { title: 'WASM 音频编解码', render: () => <WasmAudioPage /> },
  '/wasm/ai': { title: 'WASM AI 推理', render: () => <WasmAiPage /> },
  '/wasm/fractal': {
    title: 'WASM 计算可视化',
    render: () => <WasmFractalPage />,
  },
  '/wasm/runtime': {
    title: 'WASM GC 与 WASI',
    render: () => <WasmRuntimePage />,
  },
};

export function resolveRoute(url: URL) {
  const path = url.pathname.replace(/\/$/, '') || '/';
  const route = routes[path];

  return route
    ? { path, title: route.title, element: route.render(url) }
    : {
        path,
        title: '页面不存在',
        element: (
          <div className={styles.page}>
            <h1>找不到页面</h1>
            <a href="/">返回概览</a>
          </div>
        ),
      };
}
