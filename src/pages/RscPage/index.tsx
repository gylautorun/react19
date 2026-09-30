import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import {
  getAlerts,
  getSummary,
  getTrend,
  periods,
  regions,
  type Period,
  type Region,
} from '../../server/dashboard';
import styles from './index.module.scss';

async function Summary({ region, period }: { region: Region; period: Period }) {
  const data = await getSummary(region, period);
  return (
    <div className={styles['metric-grid']}>
      <div className={styles['metric-tile']}>
        <span>待处理请求</span>
        <strong>{data.requests}</strong>
        <small>服务端聚合 · 350 ms</small>
      </div>
      <div className={styles['metric-tile']}>
        <span>成交金额</span>
        <strong>¥ {data.revenue.toLocaleString('zh-CN')}</strong>
        <small>按地区与时间范围计算</small>
      </div>
      <div className={styles['metric-tile']}>
        <span>完成率</span>
        <strong>{data.completion}</strong>
        <small>服务端生成</small>
      </div>
    </div>
  );
}

async function Trend({ region, period }: { region: Region; period: Period }) {
  const points = await getTrend(region, period);
  return (
    <section className={styles['trend-panel']}>
      <h3>
        请求趋势 <span>850 ms</span>
      </h3>
      <div className={styles['trend-bars']}>
        {points.map((point) => (
          <div className={styles['trend-row']} key={point.label}>
            <span>{point.label}</span>
            <div>
              <i style={{ width: `${point.width}%` }} />
            </div>
            <strong>{point.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

async function Alerts({ region }: { region: Region }) {
  const alerts = await getAlerts(region);
  return (
    <section className={styles['alert-panel']}>
      <h3>
        运营异常 <span>1350 ms</span>
      </h3>
      {alerts.map((alert) => (
        <div className={styles['alert-row']} key={alert.id}>
          <span className={styles[`level-${alert.level}`]}>{alert.label}</span>
          <div>
            <strong>{alert.title}</strong>
            <p>{alert.detail}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function RscPage({ url }: { url: URL }) {
  const regionValue = url.searchParams.get('region');
  const periodValue = url.searchParams.get('period');
  const region: Region = regions.some((item) => item.id === regionValue)
    ? (regionValue as Region)
    : 'all';
  const period: Period = periods.some((item) => item.id === periodValue)
    ? (periodValue as Period)
    : 'today';
  const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });

  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="02 / 服务端渲染"
        title="Server Components"
        description="切换地区和时间范围后，URL 与服务端结果同步更新。指标、趋势和异常各自独立流式返回。"
        badge="真实 RSC"
      />
      <form className={styles['filter-form']} action="/rsc" method="get">
        <label>
          地区
          <select name="region" defaultValue={region}>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          时间范围
          <select name="period" defaultValue={period}>
            {periods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles['secondary-button']}>
          <RefreshCw size={15} /> 应用筛选
        </button>
      </form>
      <div className={styles['live-bar']}>
        <div>
          <span className={styles['live-indicator']} /> 服务端渲染时间{' '}
          <strong>{timestamp}</strong>
        </div>
        <span>
          当前：{regions.find((item) => item.id === region)?.label} ·{' '}
          {periods.find((item) => item.id === period)?.label}
        </span>
      </div>
      <SectionTitle
        index="实验 A"
        title="三个独立的流式区域"
        detail="刷新页面时观察骨架屏的完成顺序；更换筛选后所有结果都由服务端重新计算。"
      />
      <Suspense
        fallback={
          <div className={styles['metric-grid']}>
            {[0, 1, 2].map((key) => (
              <div className={styles['metric-skeleton']} key={key} />
            ))}
          </div>
        }
      >
        <Summary region={region} period={period} />
      </Suspense>
      <div className={styles['stream-layout']}>
        <Suspense fallback={<div className={styles['panel-skeleton']} />}>
          <Trend region={region} period={period} />
        </Suspense>
        <Suspense fallback={<div className={styles['panel-skeleton']} />}>
          <Alerts region={region} />
        </Suspense>
      </div>
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>服务端与客户端边界</h3>
          <p>
            筛选数据来自 <code>server/dashboard.ts</code>，不会进入浏览器包。GET
            表单在无 JavaScript 时同样可用；这里的等待时间仅用于观察流式边界。
          </p>
          <p className={styles['small-muted']}>
            当前路径：{url.pathname}
            {url.search}
          </p>
        </div>
        <CodeBlock
          file="src/pages/RscPage/index.tsx"
          code="<Suspense fallback={<TrendSkeleton />}>\n  <Trend region={region} period={period} />\n</Suspense>\n\nasync function Trend({ region, period }) {\n  const points = await getTrend(region, period)\n  return <TrendBars points={points} />\n}"
        />
      </div>
    </div>
  );
}
