# React 19 实验台

Vite 8 + React 19 + TypeScript 6 + Zustand 5 的交互式学习项目。使用 `@vitejs/plugin-rsc` 提供真实的 Server Components、Server Functions 和流式 SSR；React Compiler 通过 Vite 8 的 Babel preset 启用。Web Components 实验使用 Lit 3 和 `@lit/react`。

WebAssembly 模块由 AssemblyScript 编译。`pnpm dev` 与 `pnpm build` 会先生成 `public/wasm/lab.wasm`；手动重编译可运行 `pnpm build:wasm`。

## 启动

要求 Node.js 22.18+（当前依赖中的 Babel 8 要求此版本）。

```bash
pnpm install
pnpm dev
```

`@parcel/watcher` 是 Sass 的可选依赖。本项目在 `pnpm-workspace.yaml` 中明确跳过它的安装脚本；常见平台使用预编译包，Sass 也可使用其他文件监听实现。

开发服务器默认地址为 http://localhost:5173。构建与检查：

```bash
pnpm typecheck
pnpm lint
pnpm check
pnpm build
pnpm preview
```

## 样式与质量检查

- 每个页面、组件和布局使用独立文件夹，入口与样式分别为 `index.tsx`、`index.module.scss`，例如 `src/pages/OverviewPage/`。调用方可以直接从文件夹导入：`import { OverviewPage } from '../pages/OverviewPage'`。页面和组件的样式写在各自的 CSS Module 中，子元素与状态使用 SCSS 嵌套；`src/styles/global.scss` 只放全局重置和主题变量，Sass 变量位于 `src/styles/_tokens.scss`。
- Vite 从 `postcss.config.js` 加载 Autoprefixer，目标浏览器由 `package.json` 的 `browserslist` 控制，包含 Safari/iOS 14+。前缀处理只覆盖 CSS；JavaScript 兼容范围仍受 Vite 构建目标限制。
- `npm run typecheck` 使用严格 TypeScript 检查；`npm run lint` 执行 ESLint 和 Stylelint；`npm run format` 格式化源码。
- Husky 的 `pre-commit` 会对暂存的 TS/TSX/JS 运行 ESLint、对暂存的 SCSS/CSS 运行 Stylelint，然后执行完整类型检查。安装依赖时 `prepare` 脚本会设置 Git hook。

## 路由

| 路由 | 实验 |
| --- | --- |
| `/` | 概览、学习进度 |
| `/compiler` | 多条件商品筛选，以及 useMemo/useCallback 与 React Compiler 对对象、函数 props 的优化对照 |
| `/rsc` | URL 驱动的服务端筛选、三个 Suspense 流式区域 |
| `/actions` | 便签、附件工单、服务端校验、状态流转与无 JavaScript 提交 |
| `/hooks` | 字段级 useActionState 反馈、useFormStatus、乐观投票与失败回退 |
| `/concurrent` | useDeferredValue、useTransition、多维筛选、统计与分页 |
| `/store` | Zustand 共享状态与学习清单 |
| `/web-components` | Lit Canvas 趋势图与状态卡，验证 React 属性、事件、插槽和样式互操作 |
| `/wasm/image` | WASM 像素滤镜、图片上传与 PNG 导出 |
| `/wasm/audio` | WASM μ-law 音频编解码、波形与播放 |
| `/wasm/ai` | TensorFlow.js + WASM 后端在浏览器做设备异常分类 |
| `/wasm/fractal` | Worker 中使用 WASM 计算 Mandelbrot 分形 |
| `/wasm/runtime` | 浏览器 WASM GC 等能力检测、WASI Preview 2 运行边界 |

`src/root.tsx` 是入口，`src/routes/index.tsx` 负责按 URL 选择页面，浏览器导航由模板的 RSC 客户端入口处理。

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `pages/` | 各路由页面的服务端组合与说明内容 |
| `routes/` | URL 匹配、页面标题和页面选择 |
| `components/ui/` | 页面标题、章节标题和代码展示 |
| `components/demos/` | 各实验的客户端交互组件 |
| `components/web-components/` | Lit 自定义元素及其公开接口 |
| `hooks/` | 跨组件复用的客户端 Hook |
| `config/` | 导航配置 |
| `constants/` | 实验卡片与演示数据 |
| `layouts/` | HTML 文档布局和应用导航外壳 |
| `server/` | Server Actions 与仅服务端可访问的数据 |
| `store/` | Zustand 状态仓库 |
| `styles/` | 全局重置和 Sass 变量；页面样式与对应 TSX 同目录 |
| `framework/` | Vite RSC 的浏览器、SSR、RSC 入口和请求协议 |
| `wasm/` | AssemblyScript 算法源码与 WIT 组件接口示例 |
| `workers/` | 分形计算与浏览器 AI 推理线程 |
| `lib/` | WASM 加载和线性内存调用封装 |

Web Components 组件的开发过程、API 和接入示例见 [Web Components 组件开发与使用](docs/web-components.md)。

此项目使用 Vite RSC starter 的底层运行时，适合学习各机制；生产应用应结合具体全栈框架补齐数据库、鉴权、缓存与部署。示例中的便签、工单和投票只存于服务端进程内存，重启会重置；工单附件只读取名称、大小和摘要，不保存文件。Zustand 清单只存于当前浏览器会话的运行内存，刷新页面会重置。

`useStream` 不是 React 19 官方 Hook；流式内容由 Suspense 和 RSC 演示。React Compiler 是编译优化工具，不保证所有计算都能被缓存，也不能替代性能测量。

`/wasm/ai` 使用项目自带的 TensorFlow.js WASM 运行时和合成设备数据，在浏览器里训练并推理；它是教学用小模型，不是 LLM，也没有真实设备的预测精度。其他三个浏览器 WASM 实验使用项目内的 `lab.wasm`。本项目的 AssemblyScript 模块使用线性内存，并未使用 WASM GC。WASI Preview 2 需要 Wasmtime 等组件宿主；浏览器中的 `fetch`、Canvas 与 Web Worker 不等同于 WASI 系统接口。`src/wasm/processor.wit` 仅展示接口定义，没有打包成可执行的 WASI 组件。
