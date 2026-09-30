'use client';

import {
  Activity,
  Braces,
  CircleGauge,
  Cpu,
  Database,
  Image,
  Music2,
  Server,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';

export const navigationGroups = [
  { label: '开始', items: [{ path: '/', title: '概览', icon: CircleGauge }] },
  {
    label: '核心能力',
    items: [
      { path: '/compiler', title: 'React Compiler', icon: Sparkles },
      { path: '/rsc', title: 'Server Components', icon: Server },
      { path: '/actions', title: 'Server Actions', icon: Zap },
      { path: '/hooks', title: '异步 Hooks', icon: Braces },
      { path: '/concurrent', title: '并发渲染', icon: Activity },
    ],
  },
  {
    label: '状态管理',
    items: [{ path: '/store', title: 'Zustand 实战', icon: Database }],
  },
  {
    label: 'WebAssembly',
    items: [
      { path: '/wasm/image', title: '图片处理', icon: Image },
      { path: '/wasm/audio', title: '音频编解码', icon: Music2 },
      { path: '/wasm/ai', title: '本地 AI 推理', icon: Sparkles },
      { path: '/wasm/fractal', title: '计算可视化', icon: Workflow },
      { path: '/wasm/runtime', title: 'GC 与 WASI', icon: Cpu },
    ],
  },
];
