# Web Components 组件开发与使用

本项目的 `lab-status-card` 和 `lab-health-chart` 是用 Lit 3 实现的自定义元素。状态卡封装模板和内部样式；趋势图封装 Canvas 绘制、响应式尺寸和交互。React 19 实验页使用 `@lit/react` 适配复杂属性和自定义事件。

当前组件只在本仓库内使用，尚未打包或发布为独立组件库。打开 `/web-components` 可操作演示。

以下代码片段的导入路径按文件所在位置调整；Vue 和 Svelte 项目需先取得该组件模块及 `lit` 依赖。

## 需求与实现边界

| 需求             | 实现方式                                                                    | 验收方式                                 |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| 宿主更新组件内容 | `heading`、`status`、`acknowledgements` 响应式属性，`metrics` 数组 property | 改动各项控件后，卡片即时更新             |
| 组件通知宿主     | `status-action` CustomEvent，包含 `heading` 和 `status`                     | 点击“确认状态”，React 计数和最近事件更新 |
| 注入宿主内容     | `eyebrow`、`note` 具名 slot                                                 | 插入对应 `slot` 子元素                   |
| 控制品牌样式     | CSS 变量 `--lab-accent` 和 `::part(action)`                                 | 切换品牌色，卡片边线和按钮同步变化       |
| 保持样式边界     | Lit 默认 Shadow DOM                                                         | 宿主 CSS 不直接修改内部普通选择器        |

Vue 和 Svelte 可以使用相同的 HTML 标签、DOM property、CustomEvent 和样式接口，但本仓库没有安装它们的运行时，也没有进行对应集成测试。“跨框架复用”指接口可移植，不代表所有框架的绑定语法相同。

## 代码位置

| 文件                                                                                                 | 职责                                                          |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`LabStatusCard.ts`](../src/components/web-components/LabStatusCard.ts)                              | Custom Element、响应式属性、Shadow DOM 模板与样式、事件和注册 |
| [`LabHealthChart.ts`](../src/components/web-components/LabHealthChart.ts)                            | Canvas 趋势绘制、键盘与指针交互、`trend-select` 事件          |
| [`WebComponentsDemo/index.tsx`](../src/components/demos/WebComponentsDemo/index.tsx)                 | `@lit/react` 包装、React 状态和事件回传                       |
| [`WebComponentsDemo/index.module.scss`](../src/components/demos/WebComponentsDemo/index.module.scss) | 演示页外层布局、色板和 `::part` 定制                          |
| [`WebComponentsPage/index.tsx`](../src/pages/WebComponentsPage/index.tsx)                            | 页面说明与代码示例                                            |
| [`routes/index.tsx`](../src/routes/index.tsx)                                                        | `/web-components` 路由                                        |

## 开发过程

1. **先定组件契约。** 用字符串、数字属性承载简单值；用 DOM property 传递对象和数组；用自定义事件回传动作。避免把复杂数据序列化到 HTML 属性中。
2. **实现响应式属性。** `LabStatusCard` 继承 `LitElement`，在 `static properties` 中声明属性。`status` 会反映到宿主元素的 HTML 属性，供 `:host([status='...'])` 样式使用；`metrics` 设置 `attribute: false`，只能通过 property 传递。
3. **初始化与渲染。** TypeScript 字段使用 `declare` 声明，初始值放在构造函数里。直接使用原生类字段会覆盖 Lit 的响应式访问器，使属性更新失效。`render()` 使用 `html` 模板渲染卡片和指标。
4. **定义事件和样式入口。** 内部按钮派发 `status-action`，设置 `bubbles: true` 和 `composed: true`。组件内部使用 Shadow DOM；需要开放的颜色通过 CSS 变量传入，按钮通过 `part="action"` 暴露。
5. **注册和接入。** 模块在浏览器中检查 `customElements` 后注册 `lab-status-card`，并避免重复注册。React 侧用 `createComponent` 映射事件，并把 `metrics` 数组传给元素 property。
6. **验证。** 检查初次渲染、属性更新、事件详情、slot、换色和窄屏宽度；运行类型、Lint 和构建检查。

## Canvas 趋势组件

`lab-health-chart` 接收 `points` 数组、`selectedIndex` 和 `accent`。`points` 只通过 DOM property 传递；每个点包含 `label`、`tick`、`coverage` 和 `stability`。后两项是 0 到 100 的百分比。React 根据场景、观察周期、组件数和接入项目数生成模拟数据，再把新数组传给 Lit。

图表使用 `ResizeObserver` 与设备像素比调整 Canvas 清晰度。指针悬停显示日期读数；点击、方向键或 Home/End 选择日期时，组件发出 `trend-select`，`detail` 包含 `{ index, point }`。React 更新 `selectedIndex` 并显示选中值，完成数据传入与事件回传。Canvas 可通过 Tab 聚焦，选中日期以 slider 的 ARIA 值暴露。

```tsx
<HealthChart
  points={points}
  selectedIndex={selectedIndex}
  accent={accent}
  onTrendSelect={(event) => setSelectedIndex(event.detail.index)}
/>
```

图表色彩由 `accent` property 控制 Canvas 笔触，`--chart-accent` 控制 Shadow DOM 内的图例与焦点样式。宿主更新数据时应传入新数组；原地修改旧数组不会触发 Lit 属性变更检测。

## 组件 API

| 名称               | 类型                                          | 默认值         | 说明                                               |
| ------------------ | --------------------------------------------- | -------------- | -------------------------------------------------- |
| `heading`          | `string`                                      | `组件交付状态` | 标题；可通过同名 HTML 属性或 DOM property 设置     |
| `status`           | `'healthy' \| 'attention' \| 'critical'`      | `healthy`      | 运行状态；会反映为 HTML 属性                       |
| `metrics`          | `readonly { label: string; value: string }[]` | `[]`           | 三列指标；通过 DOM property 设置，不对应 HTML 属性 |
| `acknowledgements` | `number`                                      | `0`            | 默认 `note` 内容中的确认次数                       |

`status` 对应的显示文本依次是“运行正常”“需要关注”“需要处理”。请只传入表中的三个状态值。

| 扩展点           | 用途                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| `status-action`  | 点击确认按钮时触发；`detail` 为 `{ heading, status }`，事件会冒泡并穿过 Shadow DOM |
| `slot="eyebrow"` | 替换卡片顶部眉题，默认“设计系统组件”                                               |
| `slot="note"`    | 替换底部提示，默认显示 `已确认 N 次`；传入后由宿主维护该文案                       |
| `--lab-accent`   | 卡片顶边与按钮背景色，默认 `#087f75`                                               |
| `::part(action)` | 从宿主样式中定制确认按钮                                                           |

## 参数如何生效

数据从宿主流向组件时，浏览器先把 `<lab-status-card>` 升级为 `LabStatusCard`。Lit 根据 `static properties` 为声明的字段建立响应式访问器；赋新值后，Lit 安排更新并再次执行 `render()`。具体路径如下：

| 宿主输入                                              | Lit 中的处理                                             | 可见结果                                          |
| ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `heading="标题"` 或 `card.heading = '标题'`           | 字符串属性转为 `heading` property；赋值触发更新          | 卡片标题与 `status-action.detail.heading` 改变    |
| `status="attention"` 或 `card.status = 'attention'`   | 更新 `status`，并由 `reflect: true` 同步到宿主 HTML 属性 | 状态文字和 `:host([status='attention'])` 样式改变 |
| `card.metrics = [...]`                                | `attribute: false` 只接收 property；模板遍历数组         | 三列指标改变                                      |
| `acknowledgements="2"` 或 `card.acknowledgements = 2` | HTML 属性会转成数字；property 直接接收数字               | 默认 `note` 文案显示“已确认 2 次”                 |
| `style="--lab-accent: #3075aa"`                       | CSS 自定义属性从宿主继承进 Shadow DOM                    | 顶边和按钮颜色改变                                |

`metrics` 不能写成 `metrics="[...]"`：这只会得到字符串，而且组件关闭了该属性的 HTML 转换。更新指标时应赋一个**新数组**，例如 `card.metrics = [...card.metrics, nextMetric]`；原地 `push()` 不会自动触发 Lit 的属性变更检测。

点击内部按钮时，组件发出 `status-action`。事件的 `detail` 带当前 `heading` 和 `status`；`bubbles` 让事件向上冒泡，`composed` 让事件穿过 Shadow DOM。宿主监听事件、更新自己的状态，再把新的 `acknowledgements` 传回组件。若提供了 `slot="note"`，插槽内容会替代默认计数文案。

## 原生 DOM 使用

导入模块会在浏览器中注册元素。简单值可以写为 HTML 属性；数组需要设置到元素 property。

```ts
import {
  type LabStatusCard,
  type StatusActionEvent,
} from './src/components/web-components/LabStatusCard';
import './src/components/web-components/LabStatusCard';

const card = document.querySelector('lab-status-card') as LabStatusCard;
card.metrics = [
  { label: '组件', value: '24' },
  { label: '接入项目', value: '8' },
  { label: '版本', value: '3.3' },
];
card.addEventListener('status-action', (event) => {
  const { heading, status } = (event as StatusActionEvent).detail;
  console.log(heading, status);
});
```

```html
<lab-status-card
  heading="组件交付状态"
  status="healthy"
  style="--lab-accent: #3075aa"
>
  <span slot="eyebrow">跨框架设计系统</span>
</lab-status-card>
```

如果元素由动态页面稍后插入，应在插入后查询并设置 `metrics`；如果模块也可能稍后加载，可先调用 `customElements.whenDefined('lab-status-card')`。

## React 19 使用

仓库中的实际接入见 [`WebComponentsDemo/index.tsx`](../src/components/demos/WebComponentsDemo/index.tsx)。`@lit/react` 包装器把 React props 写入对应元素 property，并为自定义事件安装原生监听器。

```tsx
import * as React from 'react';
import { createComponent, type EventName } from '@lit/react';
import {
  LabStatusCard,
  type StatusActionEvent,
} from './src/components/web-components/LabStatusCard';

const StatusCard = createComponent({
  react: React,
  tagName: 'lab-status-card',
  elementClass: LabStatusCard,
  events: {
    onStatusAction: 'status-action' as EventName<StatusActionEvent>,
  },
});

function Example() {
  const [status, setStatus] = React.useState<'healthy' | 'attention'>(
    'healthy',
  );
  const [count, setCount] = React.useState(0);
  const [metrics, setMetrics] = React.useState([
    { label: '组件', value: '24' },
  ]);

  return (
    <>
      <button onClick={() => setStatus('attention')}>需要关注</button>
      <button
        onClick={() =>
          setMetrics((current) => [
            ...current,
            { label: '接入项目', value: '8' },
          ])
        }
      >
        增加指标
      </button>
      <StatusCard
        heading="组件交付状态"
        status={status}
        metrics={metrics}
        acknowledgements={count}
        onStatusAction={() => setCount((value) => value + 1)}
        style={{ '--lab-accent': '#3075aa' } as React.CSSProperties}
      >
        <span slot="eyebrow">跨框架设计系统</span>
      </StatusCard>
    </>
  );
}
```

宿主页面可继续用普通 CSS 定制公开的 part：

```css
lab-status-card::part(action) {
  min-width: 88px;
}
```

组件模块对服务端导入做了 `customElements` 存在性检查。当前页面的 Shadow DOM 内容由浏览器端元素升级后渲染，服务端 HTML 不包含完整卡片内容；需要首屏服务端预渲染时，应另行设计 Lit SSR 方案及其水合流程。

## Vue 3 使用

目标 Vue 项目需要能够导入并执行 `LabStatusCard` 模块。使用 Vite 的 Vue 插件时，把标签登记为原生 Custom Element，避免 Vue 把它解析成 Vue 组件：

```ts
// vite.config.ts（Vue 项目）
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'lab-status-card',
        },
      },
    }),
  ],
});
```

在 Vue 单文件组件中，简单值正常绑定；数组用 `.prop` 明确写入 DOM property；自定义事件用 `@status-action` 接收：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import './LabStatusCard';
import type {
  StatusActionEvent,
  StatusMetric,
  StatusTone,
} from './LabStatusCard';

const heading = ref('组件交付状态');
const status = ref<StatusTone>('healthy');
const metrics = ref<StatusMetric[]>([{ label: '组件', value: '24' }]);
const count = ref(0);

function handleAction(event: Event) {
  const { heading, status } = (event as StatusActionEvent).detail;
  console.log(heading, status);
  count.value += 1;
}
</script>

<template>
  <lab-status-card
    :heading="heading"
    :status="status"
    :metrics.prop="metrics"
    :acknowledgements="count"
    :style="{ '--lab-accent': '#3075aa' }"
    @status-action="handleAction"
  >
    <span slot="eyebrow">跨框架设计系统</span>
  </lab-status-card>
</template>
```

## Svelte 5 使用

Svelte 项目同样先导入模块以注册标签。这里用 action 设置数组 property 并管理原生事件监听器；简单值仍直接绑定到元素属性：

```svelte
<script lang="ts">
  import './LabStatusCard';
  import type {
    LabStatusCard,
    StatusActionEvent,
    StatusMetric,
    StatusTone,
  } from './LabStatusCard';

  let heading = $state('组件交付状态');
  let status = $state<StatusTone>('healthy');
  let metrics = $state<StatusMetric[]>([{ label: '组件', value: '24' }]);
  let count = $state(0);

  function connect(node: HTMLElement, initialMetrics: StatusMetric[]) {
    const card = node as LabStatusCard;
    card.metrics = initialMetrics;

    function handleAction(event: Event) {
      const { heading, status } = (event as StatusActionEvent).detail;
      console.log(heading, status);
      count += 1;
    }

    card.addEventListener('status-action', handleAction);
    return {
      update(nextMetrics: StatusMetric[]) {
        card.metrics = nextMetrics;
      },
      destroy() {
        card.removeEventListener('status-action', handleAction);
      },
    };
  }
</script>

<lab-status-card
  {heading}
  {status}
  acknowledgements={count}
  style="--lab-accent: #3075aa"
  use:connect={metrics}
>
  <span slot="eyebrow">跨框架设计系统</span>
</lab-status-card>
```

上面 Vue 和 Svelte 示例中的 `./LabStatusCard` 代表组件模块在目标项目中的实际位置。当前仓库未安装这两个框架，因此示例展示接入方式，尚未在本项目中做运行时验证。跨项目复用前还需要将元素及其依赖打包或复制到目标项目，并分别验证编译、事件和样式表现。

在 Vue 中更新指标时，重新赋值 `metrics.value = [...metrics.value, nextMetric]`；在 Svelte 中使用 `metrics = [...metrics, nextMetric]`。两者最终都要让元素的 `metrics` property 收到新数组。

## 官方参考

- [Lit 响应式属性](https://lit.dev/docs/components/properties/)与[事件](https://lit.dev/docs/components/events/)
- [Lit 与 React 集成](https://lit.dev/docs/frameworks/react/)
- [Vue 与 Web Components](https://vuejs.org/guide/extras/web-components.html)
- [Svelte action 指令](https://svelte.dev/docs/svelte/use)

## 扩展与验证

新增字段时，先确定它是 HTML 属性还是仅供 JavaScript 使用的 property，再更新 `static properties`、TypeScript 类型、默认值、模板和本文 API 表。新增事件时，定义 `detail` 类型，并在 React 包装器的 `events` 中映射。新增可定制样式时，优先提供 CSS 变量或 `part`，不要让宿主依赖 Shadow DOM 内部类名。

本地检查：

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

打开 `/web-components`，切换运行场景和观察周期，并修改组件数量、接入项目数与品牌色。确认 Canvas 曲线和读数更新；在图上点击、悬停并用方向键选择日期，确认 React 事件面板同步。再修改标题、状态和版本，点击“确认状态”，检查状态卡与确认次数更新，并检查窄屏下没有横向溢出。

跨项目发布还需要单独的包入口、类型声明、版本管理和目标框架的集成测试；这些不属于当前仓库内演示组件的实现范围。
