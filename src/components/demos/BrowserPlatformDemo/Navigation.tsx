import { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';

type NavigationMessage = {
  source: 'navigation-lab';
  phase: string;
  step: string;
  entry: number;
  supported: boolean;
};

export function NavigationDemo() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [events, setEvents] = useState<NavigationMessage[]>([]);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent<NavigationMessage>) {
      if (
        event.origin !== location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.source !== 'navigation-lab'
      )
        return;
      setSupported(event.data.supported);
      setEvents((current) => [event.data, ...current].slice(0, 8));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>Navigation API</h2>
          <p>在独立文档中拦截同源导航，观察提交、完成和历史回退。</p>
        </div>
        <span
          className={styles.support}
          data-supported={String(supported === true)}
        >
          {supported === null
            ? '检测中'
            : supported
              ? '当前浏览器支持'
              : 'History API 降级'}
        </span>
      </div>
      <div className={styles.split}>
        <iframe
          ref={frameRef}
          className={styles.frame}
          title="Navigation API 隔离实验"
          src="/navigation-sandbox.html"
        />
        <div className={styles.results}>
          <div className={styles.subheading}>导航事件</div>
          <div className={styles.log} aria-live="polite">
            {events.length ? (
              events.map((event, index) => (
                <div
                  className={styles['log-row']}
                  key={`${event.phase}-${event.entry}-${index}`}
                >
                  <span>{event.phase}</span>
                  <strong>
                    {event.step} · entry {event.entry}
                  </strong>
                </div>
              ))
            ) : (
              <div className={styles['log-row']}>
                <span>等待导航事件</span>
                <strong>—</strong>
              </div>
            )}
          </div>
          <p className={styles.note}>
            主应用使用自有 RSC 导航。此文档隔离了 Navigation API 的拦截逻辑，
            不改变主应用的路由处理。
          </p>
        </div>
      </div>
    </section>
  );
}
