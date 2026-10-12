import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ExternalLink, Play, Square } from 'lucide-react';
import styles from './index.module.scss';

const destinations = [
  { path: '/compiler', label: 'React Compiler' },
  { path: '/web-components', label: 'Web Components' },
  { path: '/wasm/runtime', label: 'WASM 运行时' },
] as const;

type RuleMode = 'prefetch' | 'prerender';

const subscribeStatic = () => () => {};

function supportsSpeculationRules() {
  return (
    typeof HTMLScriptElement.supports === 'function' &&
    HTMLScriptElement.supports('speculationrules')
  );
}

export function SpeculationDemo() {
  const supported = useSyncExternalStore(
    subscribeStatic,
    supportsSpeculationRules,
    () => null,
  );
  const [mode, setMode] = useState<RuleMode>('prefetch');
  const [destination, setDestination] = useState<string>(destinations[0].path);
  const [installed, setInstalled] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    return () => scriptRef.current?.remove();
  }, []);

  function removeRule() {
    scriptRef.current?.remove();
    scriptRef.current = null;
    setInstalled(false);
  }

  function installRule() {
    if (!supported) return;
    scriptRef.current?.remove();
    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify({
      [mode]: [
        {
          source: 'document',
          where: { href_matches: destination },
          eagerness: 'moderate',
        },
      ],
    });
    document.head.append(script);
    scriptRef.current = script;
    setInstalled(true);
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>Speculation Rules</h2>
          <p>向文档安装候选规则，由浏览器决定是否预获取或预渲染。</p>
        </div>
        <span
          className={styles.support}
          data-supported={String(supported === true)}
        >
          {supported === null
            ? '检测中'
            : supported
              ? '当前浏览器支持'
              : '当前浏览器不支持'}
        </span>
      </div>
      <div className={styles.split}>
        <div className={styles.controls}>
          <div className={styles.subheading}>规则配置</div>
          <label className={styles.field}>
            策略
            <select
              value={mode}
              disabled={installed}
              onChange={(event) => setMode(event.target.value as RuleMode)}
            >
              <option value="prefetch">Prefetch · 获取资源</option>
              <option value="prerender">Prerender · 预渲染页面</option>
            </select>
          </label>
          <label className={styles.field}>
            目标页面
            <select
              value={destination}
              disabled={installed}
              onChange={(event) => setDestination(event.target.value)}
            >
              {destinations.map((item) => (
                <option key={item.path} value={item.path}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              disabled={!supported || installed}
              onClick={installRule}
            >
              <Play size={14} /> 安装规则
            </button>
            <button
              className={styles['secondary-button']}
              type="button"
              disabled={!installed}
              onClick={removeRule}
            >
              <Square size={13} /> 移除规则
            </button>
          </div>
          <div className={styles['result-line']} role="status">
            {installed ? `${mode} 规则已安装` : '尚未安装规则'}
          </div>
        </div>
        <div className={styles.results}>
          <div className={styles.subheading}>候选链接</div>
          <div className={styles.log}>
            {destinations.map((item) => (
              <div className={styles['log-row']} key={item.path}>
                <span>{item.label}</span>
                <a href={item.path} data-native-navigation="true">
                  打开页面 <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            “规则已安装”不等于资源已下载。浏览器会结合网络、设备和用户设置决定是否执行。
            本实验使用原生整页导航，让预渲染结果有机会在目标页激活。
          </p>
        </div>
      </div>
    </section>
  );
}
