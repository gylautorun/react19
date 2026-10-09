import { WebComponentsDemo } from '../../components/demos/WebComponentsDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function WebComponentsPage() {
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="07 / 跨框架组件"
        title="Web Components"
        description="用 Lit 封装 Canvas 趋势图和状态卡，在 React 19 中验证复杂数据、事件、插槽和样式定制。"
        badge="Lit 3 + React 19"
      />
      <SectionTitle
        index="实验"
        title="React 与 Lit 双向联动"
        detail="趋势与状态共享配置，选中值和确认事件回流到 React。"
      />
      <WebComponentsDemo />
      <SectionTitle index="契约" title="跨框架复用的四个接口" />
      <div className={styles['contract-grid']}>
        <div className={styles['contract-row']}>
          <strong>属性</strong>
          <span>
            标题、状态和数字使用标准属性；指标与趋势数组通过 DOM property 传入。
          </span>
        </div>
        <div className={styles['contract-row']}>
          <strong>事件</strong>
          <span>
            状态卡发出 status-action；Canvas 图表发出 trend-select，React
            接收后更新选中数据。
          </span>
        </div>
        <div className={styles['contract-row']}>
          <strong>内容</strong>
          <span>具名 slot 注入眉题，保留组件内部结构。</span>
        </div>
        <div className={styles['contract-row']}>
          <strong>样式</strong>
          <span>
            Shadow DOM 隔离内部样式，CSS 变量与 ::part 提供显式定制点。
          </span>
        </div>
      </div>
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>设计系统接入边界</h3>
          <p>
            图表自己管理 Canvas
            绘制、缩放与指针交互。宿主只传入趋势数组和选中索引，
            再监听自定义事件；React、Vue 或 Svelte 均可接入这组 DOM 接口。
          </p>
        </div>
        <CodeBlock
          file="src/components/demos/WebComponentsDemo/index.tsx"
          code={`const HealthChart = createComponent({
  react: React,
  tagName: 'lab-health-chart',
  elementClass: LabHealthChart,
  events: { onTrendSelect: 'trend-select' }
});

<HealthChart
  points={points}
  selectedIndex={selectedIndex}
  onTrendSelect={(event) => setSelectedIndex(event.detail.index)}
/>`}
        />
      </div>
    </div>
  );
}
