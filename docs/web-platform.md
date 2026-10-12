# 浏览器能力实验室

`/web-platform` 提供六组可操作实验。所有可选 API 都在运行时检测；页面只报告当前浏览器的实际支持情况。

首屏只加载交互性能实验；其他实验通过 `React.lazy` 按选项卡分包，并在悬停或聚焦选项卡时预加载对应模块。

| 实验                   | 实现位置                                                                            | 可验证的行为                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core Web Vitals 与负载 | `src/components/demos/BrowserPlatformDemo/Vitals.tsx`、`src/workers/interaction.ts` | `web-vitals` 采集 INP/LCP/CLS；相同任务分别阻塞主线程、分片执行或交给 Worker；显示 INP 归因和 Long Animation Frame                                |
| Speculation Rules      | `Speculation.tsx`                                                                   | 注入或移除 `speculationrules` 脚本，分别尝试 prefetch/prerender；候选链接使用浏览器原生整页导航                                                   |
| Navigation API         | `Navigation.tsx`、`public/navigation-sandbox.html`                                  | 在隔离文档中执行导航拦截、异步处理、前进后退、模拟失败与重试并记录事件；不支持时使用 History API                                                  |
| Popover / Dialog       | `NativeUi.tsx`                                                                      | 原生浮层、轻触关闭、模态对话框与返回值；不支持时提供基本降级界面                                                                                  |
| Storage Buckets        | `Storage.tsx`                                                                       | 命名 bucket 内的 IndexedDB 读写、配额、到期请求、持久化与删除；不支持时使用普通 IndexedDB                                                         |
| WebGPU                 | `WebGpu.tsx`                                                                        | WGSL compute shader 生成 Mandelbrot 迭代数据，读回后绘制 Canvas；可切换 CPU 计算、分辨率、迭代次数和调色，点击定位放大或用按钮在 0.25×–16× 间缩放 |

## 指标解释

INP 已在 2024 年取代 FID 成为 Core Web Vitals 指标。`web-vitals` 使用浏览器 Event Timing 数据计算页面生命周期中的 INP 候选值；本地仪表盘显示的是当前这次访问，不是用户群体的第 75 百分位。良好体验的常用阈值是 INP ≤ 200 ms。LCP 和 CLS 也来自真实浏览器性能条目。

“计算与读回”以及“任务完成时间”不是 INP。单次实验结果会受设备、浏览器、缓存和后台任务影响。INP 归因将一次慢交互拆为输入等待、事件处理与呈现延迟；页面基于占比给出确定性的排查建议，没有接入 AI 诊断服务。Long Animation Frame 只有在浏览器提供该 Performance Entry 类型时才显示。

## 能力边界

- Speculation Rules 的规则安装不保证浏览器真的执行预获取或预渲染。网络状况、资源压力、设置及目标页面适用性都会影响决策。主应用路由拦截器只对标有 `data-native-navigation` 的实验链接放行，以便尝试激活浏览器预渲染。
- Navigation API 的支持范围仍需逐浏览器检测，不能视为对 History API 或现有路由器的通用替代。实验放在同源 iframe 内，避免修改 RSC 客户端的导航逻辑。
- Storage Buckets 的可用性取决于浏览器。`expires` 与 `persist()` 是请求，浏览器仍可按自己的存储策略处理；普通 IndexedDB 降级不具备桶隔离。
- WebGPU 与 WebGL 面向不同的兼容性和使用场景。这里使用 WebGPU compute pipeline，不宣称 WebGL 已被替代。GPU 计时包含缓冲区读回，和 CPU 总耗时只能作同机实验对照。

## 本地验证

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

打开 `/web-platform`。先在“交互性能”中执行三种计算方式并观察响应探针和 INP；然后分别安装预加载规则、操作导航历史、打开浮层、读写测试 bucket，最后在 WebGPU 与 CPU 间切换、放大和缩小图像。使用浏览器开发者工具检查实际网络请求、GPU 适配器和性能记录；页面中的“支持”徽标只表示 API 能力。
