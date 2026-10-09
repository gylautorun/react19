'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { createComponent, type EventName } from '@lit/react';
import {
  LabHealthChart,
  type HealthPoint,
  type TrendSelectEvent,
} from '../../web-components/LabHealthChart';
import {
  LabStatusCard,
  type StatusActionEvent,
  type StatusMetric,
  type StatusTone,
} from '../../web-components/LabStatusCard';
import styles from './index.module.scss';

const StatusCard = createComponent({
  react: React,
  tagName: 'lab-status-card',
  elementClass: LabStatusCard,
  events: {
    onStatusAction: 'status-action' as EventName<StatusActionEvent>,
  },
});

const HealthChart = createComponent({
  react: React,
  tagName: 'lab-health-chart',
  elementClass: LabHealthChart,
  events: {
    onTrendSelect: 'trend-select' as EventName<TrendSelectEvent>,
  },
});

const states: { value: StatusTone; label: string }[] = [
  { value: 'healthy', label: '正常' },
  { value: 'attention', label: '关注' },
  { value: 'critical', label: '处理' },
];

const accents = [
  { name: '青绿', value: '#087f75' },
  { name: '蓝色', value: '#3075aa' },
  { name: '珊瑚', value: '#bf604c' },
];

const scenarios = [
  { value: 'stable', label: '稳态' },
  { value: 'rollout', label: '扩张' },
  { value: 'incident', label: '故障' },
] as const;

type Scenario = (typeof scenarios)[number]['value'];

const periods = [7, 14, 30] as const;
type Period = (typeof periods)[number];

function createHealthPoints(
  days: Period,
  scenario: Scenario,
  componentCount: number,
  projectCount: number,
): HealthPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const progress = index / (days - 1);
    const incident =
      scenario === 'incident'
        ? Math.max(0, 1 - Math.abs(progress - 0.72) / 0.24)
        : 0;
    const growth = scenario === 'rollout' ? 24 : 9;
    const coverage = Math.min(
      99,
      Math.max(
        0,
        Math.round(
          35 +
            projectCount * 2.5 +
            progress * growth +
            Math.sin(index * 1.4) * 2 -
            incident * 10,
        ),
      ),
    );
    const stability = Math.min(
      99,
      Math.max(
        0,
        Math.round(
          97 -
            componentCount * 0.12 -
            (scenario === 'rollout' ? progress * 4 : 0) +
            Math.sin(index * 1.8) * 1.5 -
            incident * 27,
        ),
      ),
    );
    const remaining = days - index - 1;

    return {
      label: remaining === 0 ? '今天' : `${remaining} 天前`,
      tick: remaining === 0 ? '今天' : `D-${remaining}`,
      coverage,
      stability,
    };
  });
}

export function WebComponentsDemo() {
  const [heading, setHeading] = useState('组件交付状态');
  const [status, setStatus] = useState<StatusTone>('healthy');
  const [componentCount, setComponentCount] = useState(24);
  const [projectCount, setProjectCount] = useState(8);
  const [version, setVersion] = useState('3.3');
  const [accent, setAccent] = useState(accents[0].value);
  const [scenario, setScenario] = useState<Scenario>('stable');
  const [period, setPeriod] = useState<Period>(14);
  const [selectedIndex, setSelectedIndex] = useState(13);
  const [acknowledgements, setAcknowledgements] = useState(0);
  const [lastEvent, setLastEvent] = useState('尚无事件');

  const points = useMemo(
    () => createHealthPoints(period, scenario, componentCount, projectCount),
    [period, scenario, componentCount, projectCount],
  );
  const selectedPoint = points[selectedIndex];

  const metrics: StatusMetric[] = [
    { label: '组件', value: String(componentCount) },
    { label: '接入项目', value: String(projectCount) },
    { label: '版本', value: version.trim() || '-' },
  ];

  function handleAction(event: StatusActionEvent) {
    setAcknowledgements((count) => count + 1);
    setLastEvent(`${event.detail.heading} · ${event.detail.status}`);
  }

  function handleTrendSelect(event: TrendSelectEvent) {
    setSelectedIndex(event.detail.index);
    setLastEvent(
      `${event.detail.point.label} · 覆盖 ${event.detail.point.coverage}%`,
    );
  }

  return (
    <div className={styles['demo']}>
      <div className={styles['controls']}>
        <div className={styles['panel-heading']}>React 控制台</div>
        <div className={styles['group-heading']}>组件参数</div>
        <label className={styles['field']}>
          组件标题
          <input
            value={heading}
            maxLength={28}
            onChange={(event) => setHeading(event.target.value)}
          />
        </label>
        <div className={styles['field']}>
          <span>运行状态</span>
          <div
            className={styles['segmented']}
            role="group"
            aria-label="运行状态"
          >
            {states.map((state) => (
              <button
                key={state.value}
                type="button"
                aria-pressed={status === state.value}
                onClick={() => setStatus(state.value)}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>
        <label className={styles['field']}>
          <span className={styles['range-heading']}>
            组件数量 <strong>{componentCount}</strong>
          </span>
          <input
            type="range"
            min="4"
            max="64"
            value={componentCount}
            onChange={(event) => setComponentCount(Number(event.target.value))}
          />
        </label>
        <label className={styles['field']}>
          接入项目
          <input
            type="number"
            min="0"
            max="99"
            value={projectCount}
            onChange={(event) =>
              setProjectCount(
                Math.min(99, Math.max(0, Number(event.target.value))),
              )
            }
          />
        </label>
        <label className={styles['field']}>
          版本
          <input
            value={version}
            maxLength={12}
            onChange={(event) => setVersion(event.target.value)}
          />
        </label>
        <div className={styles['field']}>
          <span>品牌色</span>
          <div className={styles['swatches']} role="group" aria-label="品牌色">
            {accents.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.name}
                aria-label={option.name}
                aria-pressed={accent === option.value}
                style={{ backgroundColor: option.value }}
                onClick={() => setAccent(option.value)}
              />
            ))}
          </div>
        </div>
        <div className={styles['group-heading']}>趋势数据</div>
        <div className={styles['field']}>
          <span>运行场景</span>
          <div
            className={styles['segmented']}
            role="group"
            aria-label="运行场景"
          >
            {scenarios.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={scenario === option.value}
                onClick={() => setScenario(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles['field']}>
          <span>观察周期</span>
          <div
            className={styles['segmented']}
            role="group"
            aria-label="观察周期"
          >
            {periods.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={period === days}
                onClick={() => {
                  setPeriod(days);
                  setSelectedIndex(days - 1);
                }}
              >
                {days} 天
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles['preview']}>
        <div className={styles['panel-heading']}>Lit 实时预览</div>
        <HealthChart
          points={points}
          selectedIndex={selectedIndex}
          accent={accent}
          onTrendSelect={handleTrendSelect}
          style={{ '--chart-accent': accent } as React.CSSProperties}
        />
        <div className={styles['preview-bottom']}>
          <StatusCard
            heading={heading || '未命名组件'}
            status={status}
            metrics={metrics}
            acknowledgements={acknowledgements}
            onStatusAction={handleAction}
            style={{ '--lab-accent': accent } as React.CSSProperties}
          >
            <span slot="eyebrow">跨框架设计系统</span>
          </StatusCard>
          <div className={styles['event-panel']} role="status">
            <div className={styles['panel-heading']}>React 事件面板</div>
            <div className={styles['event-output']}>
              <div>
                <span>选中日期</span>
                <strong>{selectedPoint.label}</strong>
              </div>
              <div>
                <span>接入覆盖率</span>
                <strong>{selectedPoint.coverage}%</strong>
              </div>
              <div>
                <span>运行稳定率</span>
                <strong>{selectedPoint.stability}%</strong>
              </div>
              <div>
                <span>确认次数</span>
                <strong>{acknowledgements}</strong>
              </div>
            </div>
            <div className={styles['last-event']}>
              <span>最近事件</span>
              <strong>{lastEvent}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
