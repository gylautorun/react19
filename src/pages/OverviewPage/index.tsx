import { ProgressSummary } from '../../components/demos/ProgressSummary';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { modules } from '../../constants/modules';
import styles from './index.module.scss';

export function OverviewPage() {
  return (
    <div className={styles['page']}>
      <div className={styles['overview-intro']}>
        <div>
          <div className={styles['eyebrow']}>REACT 19 · INTERACTIVE LAB</div>
          <h1>
            边动手，边理解
            <br />
            <span>React 19</span>
          </h1>
          <p>
            十二个独立实验，覆盖 React 19 核心能力、Web Components 互操作，以及
            WebAssembly 的图片、音频、AI、可视化和运行时边界。
          </p>
          <a className={styles['primary-button']} href="/compiler">
            开始第一个实验 <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className={styles['overview-graphic']} aria-hidden="true">
          <div
            className={[styles['graphic-ring'], styles['ring-one']].join(' ')}
          />
          <div
            className={[styles['graphic-ring'], styles['ring-two']].join(' ')}
          />
          <div className={styles['graphic-center']}>19</div>
          <span className={styles['graphic-code']}>&lt;App /&gt;</span>
          <span className={styles['graphic-label']}>VITE + RSC</span>
        </div>
      </div>
      <div className={styles['overview-meta']}>
        <span>
          <strong>12</strong> 个交互实验
        </span>
        <span>
          <strong>19.3</strong> React 版本
        </span>
        <span>
          <strong>Vite 8</strong> 构建工具
        </span>
        <ProgressSummary />
      </div>
      <SectionTitle
        index="01"
        title="选择一个主题"
        detail="每个页面都有可操作示例和对应代码片段。"
      />
      <div className={styles['module-grid']}>
        {modules.map((module) => (
          <a
            className={[
              styles['module-card'],
              styles['tone-' + module.tone],
            ].join(' ')}
            href={module.path}
            key={module.path}
          >
            <div className={styles['module-top']}>
              <span>
                {module.num} / {String(modules.length).padStart(2, '0')}
              </span>
              <span className={styles['module-arrow']}>↗</span>
            </div>
            <div>
              <span className={styles['module-tag']}>{module.tag}</span>
              <h3>{module.title}</h3>
              <p>{module.detail}</p>
            </div>
          </a>
        ))}
      </div>
      <div className={styles['fact-note']}>
        <strong>版本提示</strong>
        <p>
          React 19 有 <code>useActionState</code>、<code>useOptimistic</code> 和{' '}
          <code>useTransition</code>；<code>useStream</code> 不是 React 19 官方
          Hook。这里用 Suspense 与 RSC 流演示流式内容。RSC 和 Server Actions
          依赖 Vite 的 RSC 插件及服务端运行时，并非普通 Vite SPA 自带功能。
        </p>
      </div>
    </div>
  );
}
