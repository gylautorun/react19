'use client';

import { lazy, Suspense, useState, type KeyboardEvent } from 'react';
import {
  Activity,
  ArrowLeftRight,
  Database,
  Gauge,
  Layers3,
  Zap,
} from 'lucide-react';
import { VitalsDemo } from './Vitals';
import styles from './index.module.scss';

const SpeculationDemo = lazy(() =>
  import('./Speculation').then((module) => ({
    default: module.SpeculationDemo,
  })),
);
const NavigationDemo = lazy(() =>
  import('./Navigation').then((module) => ({ default: module.NavigationDemo })),
);
const NativeUiDemo = lazy(() =>
  import('./NativeUi').then((module) => ({ default: module.NativeUiDemo })),
);
const StorageDemo = lazy(() =>
  import('./Storage').then((module) => ({ default: module.StorageDemo })),
);
const WebGpuDemo = lazy(() =>
  import('./WebGpu').then((module) => ({ default: module.WebGpuDemo })),
);

const tabs = [
  { id: 'vitals', label: '交互性能', icon: Gauge },
  { id: 'speculation', label: '预加载', icon: Zap },
  { id: 'navigation', label: '导航', icon: ArrowLeftRight },
  { id: 'native-ui', label: '原生浮层', icon: Layers3 },
  { id: 'storage', label: '分桶存储', icon: Database },
  { id: 'webgpu', label: 'WebGPU', icon: Activity },
] as const;

type TabId = (typeof tabs)[number]['id'];

function preloadTab(id: TabId) {
  if (id === 'speculation') void import('./Speculation');
  if (id === 'navigation') void import('./Navigation');
  if (id === 'native-ui') void import('./NativeUi');
  if (id === 'storage') void import('./Storage');
  if (id === 'webgpu') void import('./WebGpu');
}

export function BrowserPlatformDemo() {
  const [activeTab, setActiveTab] = useState<TabId>('vitals');

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    id: TabId,
  ) {
    const index = tabs.findIndex((tab) => tab.id === id);
    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft')
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextId = tabs[nextIndex].id;
    setActiveTab(nextId);
    document.getElementById(`tab-${nextId}`)?.focus();
  }

  return (
    <div className={styles.lab}>
      <div className={styles.tabs} role="tablist" aria-label="浏览器能力实验">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => handleTabKeyDown(event, id)}
            onMouseEnter={() => preloadTab(id)}
            onFocus={() => preloadTab(id)}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div
        id="panel-vitals"
        role="tabpanel"
        aria-labelledby="tab-vitals"
        hidden={activeTab !== 'vitals'}
      >
        <VitalsDemo />
      </div>
      {tabs
        .filter((tab) => tab.id !== 'vitals')
        .map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && (
              <Suspense
                fallback={<div className={styles.note}>正在加载实验…</div>}
              >
                {tab.id === 'speculation' && <SpeculationDemo />}
                {tab.id === 'navigation' && <NavigationDemo />}
                {tab.id === 'native-ui' && <NativeUiDemo />}
                {tab.id === 'storage' && <StorageDemo />}
                {tab.id === 'webgpu' && <WebGpuDemo />}
              </Suspense>
            )}
          </div>
        ))}
    </div>
  );
}
