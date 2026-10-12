'use client';

import { useState, type CSSProperties } from 'react';
import { Download, FileText, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ReportOptions } from '../../../lib/docxReport';
import styles from './index.module.scss';

const defaults: ReportOptions = {
  title: '季度运营报告',
  subtitle: '2026 年第三季度 · 业务回顾',
  author: '数据分析团队',
  summary:
    '本季度核心指标保持增长。客户留存与订单转化同步改善，投入结构更趋稳健。',
  analysis:
    '客户留存率持续提升，说明服务流程优化已开始产生稳定效果。下一季度应继续跟踪新客户的首月体验。\n\n订单转化增长快于访问量，建议保留当前高转化渠道的预算，并对低效渠道进行小规模试验。\n\n建议每月复盘指标口径与数据质量，确保跨季度比较具有一致性。',
  metrics: [
    { label: '新增客户', previous: 128, current: 156 },
    { label: '活跃项目', previous: 72, current: 89 },
    { label: '完成订单', previous: 210, current: 268 },
    { label: '服务工单', previous: 64, current: 51 },
  ],
  paper: 'a4',
  orientation: 'portrait',
  margin: 'normal',
  columns: 2,
  accent: '168477',
  shapeWidth: 92,
  chart: true,
  watermark: false,
  watermarkText: '内部草稿',
};

const accents = [
  { label: '青绿', value: '168477' },
  { label: '蓝色', value: '2878A4' },
  { label: '赤红', value: 'B94B45' },
  { label: '深灰', value: '43565D' },
] as const;

type PreviewPage = 'cover' | 'metrics' | 'analysis';
const previewPages: { id: PreviewPage; label: string }[] = [
  { id: 'cover', label: '封面' },
  { id: 'metrics', label: '指标' },
  { id: 'analysis', label: '分析' },
];

export function DocxStudio() {
  const [options, setOptions] = useState<ReportOptions>(defaults);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [previewPage, setPreviewPage] = useState<PreviewPage>('cover');

  function setField<K extends keyof ReportOptions>(
    key: K,
    value: ReportOptions[K],
  ) {
    setOptions((current) => ({ ...current, [key]: value }));
    setStatus('');
    setError('');
  }

  function setMetric(
    index: number,
    key: 'label' | 'previous' | 'current',
    value: string,
  ) {
    setOptions((current) => ({
      ...current,
      metrics: current.metrics.map((metric, metricIndex) =>
        metricIndex === index
          ? { ...metric, [key]: key === 'label' ? value : Number(value) }
          : metric,
      ),
    }));
    setStatus('');
    setError('');
  }

  function addMetric() {
    setOptions((current) => ({
      ...current,
      metrics: [
        ...current.metrics,
        { label: '新指标', previous: 0, current: 0 },
      ],
    }));
    setStatus('');
    setError('');
  }

  function removeMetric(index: number) {
    setOptions((current) => ({
      ...current,
      metrics: current.metrics.filter(
        (_, metricIndex) => metricIndex !== index,
      ),
    }));
    setStatus('');
    setError('');
  }

  async function download() {
    if (busy) return;
    if (
      !options.title.trim() ||
      !options.author.trim() ||
      (options.watermark && !options.watermarkText.trim()) ||
      options.metrics.some(
        (metric) =>
          !metric.label.trim() ||
          !Number.isFinite(metric.previous) ||
          !Number.isFinite(metric.current) ||
          metric.previous < 0 ||
          metric.current < 0 ||
          metric.previous > 999999 ||
          metric.current > 999999,
      )
    ) {
      setError('请填写标题、作者、水印和所有指标；数值范围为 0–999999。');
      return;
    }
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const { buildDocxReport } = await import('../../../lib/docxReport');
      const { blob, pages, estimated } = await buildDocxReport(options);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${options.title
        .trim()
        .replace(/[\\/:*?"<>|]/g, '-')
        .slice(0, 60)}.docx`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus(
        `已生成 ${pages} 页${estimated ? '（部分版面采用估算）' : ''} · ${(blob.size / 1024).toFixed(0)} KB`,
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '文档生成失败');
    } finally {
      setBusy(false);
    }
  }

  const scale = Math.max(
    1,
    ...options.metrics.flatMap((metric) => [metric.previous, metric.current]),
  );
  const accentStyle = { '--doc-accent': `#${options.accent}` } as CSSProperties;

  return (
    <div className={styles.studio} style={accentStyle}>
      <div className={styles.toolbar}>
        <div className={styles['toolbar-title']}>
          <FileText size={18} />
          <div>
            <strong>报告编辑器</strong>
            <span>DOCX 9.9.0</span>
          </div>
        </div>
        <div className={styles['toolbar-actions']}>
          <button
            type="button"
            className={styles.reset}
            title="恢复示例内容"
            aria-label="恢复示例内容"
            disabled={busy}
            onClick={() => {
              setOptions(defaults);
              setPreviewPage('cover');
              setStatus('');
              setError('');
            }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            className={styles.download}
            disabled={busy}
            onClick={() => void download()}
          >
            <Download size={16} /> {busy ? '生成中…' : '下载 DOCX'}
          </button>
        </div>
      </div>
      <p className={styles.editability}>
        在文档页面直接编辑文字和表格；图表、形状、水印与版式同步更新到导出的
        DOCX。
      </p>
      {(status || error) && (
        <p className={styles.message} data-error={Boolean(error)} role="status">
          {error || status}
        </p>
      )}
      <div className={styles.workspace}>
        <div className={styles.editor}>
          <div className={styles['editor-section']}>
            <h2>页面设置</h2>
            <div className={styles['field-pair']}>
              <label>
                纸张
                <select
                  value={options.paper}
                  onChange={(event) =>
                    setField(
                      'paper',
                      event.target.value as ReportOptions['paper'],
                    )
                  }
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </label>
              <label>
                页边距
                <select
                  value={options.margin}
                  onChange={(event) =>
                    setField(
                      'margin',
                      event.target.value as ReportOptions['margin'],
                    )
                  }
                >
                  <option value="normal">标准</option>
                  <option value="narrow">窄边距</option>
                </select>
              </label>
            </div>
            <div className={styles['field-pair']}>
              <div className={styles.choice}>
                <span>页面方向</span>
                <div
                  className={styles.segmented}
                  role="group"
                  aria-label="页面方向"
                >
                  <button
                    type="button"
                    aria-pressed={options.orientation === 'portrait'}
                    onClick={() => setField('orientation', 'portrait')}
                  >
                    纵向
                  </button>
                  <button
                    type="button"
                    aria-pressed={options.orientation === 'landscape'}
                    onClick={() => setField('orientation', 'landscape')}
                  >
                    横向
                  </button>
                </div>
              </div>
              <div className={styles.choice}>
                <span>分析分栏</span>
                <div
                  className={styles.segmented}
                  role="group"
                  aria-label="分析分栏"
                >
                  <button
                    type="button"
                    aria-pressed={options.columns === 1}
                    onClick={() => setField('columns', 1)}
                  >
                    单栏
                  </button>
                  <button
                    type="button"
                    aria-pressed={options.columns === 2}
                    onClick={() => setField('columns', 2)}
                  >
                    双栏
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.choice}>
              <span>强调色</span>
              <div className={styles.swatches} role="group" aria-label="强调色">
                {accents.map((accent) => (
                  <button
                    key={accent.value}
                    type="button"
                    title={accent.label}
                    aria-label={accent.label}
                    aria-pressed={options.accent === accent.value}
                    style={{ backgroundColor: `#${accent.value}` }}
                    onClick={() => setField('accent', accent.value)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className={styles['editor-section']}>
            <h2>文档元素</h2>
            <label>
              <span className={styles['field-top']}>
                封面线条宽度 <strong>{options.shapeWidth}px</strong>
              </span>
              <input
                type="range"
                min="40"
                max="180"
                step="10"
                value={options.shapeWidth}
                onChange={(event) =>
                  setField('shapeWidth', Number(event.target.value))
                }
              />
            </label>
            <div className={styles.switches}>
              <label>
                <input
                  type="checkbox"
                  checked={options.chart}
                  onChange={(event) => setField('chart', event.target.checked)}
                />{' '}
                插入可编辑图表
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.watermark}
                  onChange={(event) =>
                    setField('watermark', event.target.checked)
                  }
                />{' '}
                文档水印
              </label>
            </div>
            {options.watermark && (
              <label>
                水印文字
                <input
                  value={options.watermarkText}
                  maxLength={24}
                  onChange={(event) =>
                    setField('watermarkText', event.target.value)
                  }
                />
              </label>
            )}
          </div>
        </div>
        <div className={styles.preview}>
          <div className={styles['preview-heading']}>
            <h2>在线文档</h2>
            <span>
              {options.paper.toUpperCase()} ·{' '}
              {options.orientation === 'portrait' ? '纵向' : '横向'}
            </span>
          </div>
          <div
            className={styles['preview-tabs']}
            role="tablist"
            aria-label="文档章节"
          >
            {previewPages.map((page) => (
              <button
                key={page.id}
                type="button"
                role="tab"
                aria-selected={previewPage === page.id}
                onClick={() => setPreviewPage(page.id)}
              >
                {page.label}
              </button>
            ))}
          </div>
          <div
            className={styles.paper}
            data-orientation={options.orientation}
            data-margin={options.margin}
          >
            <div className={styles['paper-inner']}>
              <div className={styles['paper-top']}>
                <span>{options.title || '未命名报告'}</span>
                <span>{options.author || '作者'}</span>
              </div>
              {options.watermark && (
                <div className={styles.watermark} aria-hidden="true">
                  {options.watermarkText}
                </div>
              )}
              <div className={styles['paper-body']}>
                {previewPage === 'cover' && (
                  <div className={styles['preview-cover']}>
                    <div
                      className={styles['cover-rule']}
                      style={{ width: options.shapeWidth / 2 }}
                    />
                    <textarea
                      className={styles['paper-title']}
                      aria-label="文档标题"
                      rows={2}
                      maxLength={70}
                      value={options.title}
                      onChange={(event) =>
                        setField('title', event.target.value)
                      }
                    />
                    <textarea
                      className={styles['paper-subtitle']}
                      aria-label="文档副标题"
                      rows={2}
                      maxLength={100}
                      value={options.subtitle}
                      onChange={(event) =>
                        setField('subtitle', event.target.value)
                      }
                    />
                    <textarea
                      className={styles['paper-summary']}
                      aria-label="封面摘要"
                      rows={4}
                      value={options.summary}
                      onChange={(event) =>
                        setField('summary', event.target.value)
                      }
                    />
                    <input
                      className={styles['paper-author']}
                      aria-label="文档作者"
                      maxLength={50}
                      value={options.author}
                      onChange={(event) =>
                        setField('author', event.target.value)
                      }
                    />
                  </div>
                )}
                {previewPage === 'metrics' && (
                  <>
                    <h4>指标概览</h4>
                    <textarea
                      className={styles['paper-summary']}
                      aria-label="指标摘要"
                      rows={4}
                      value={options.summary}
                      onChange={(event) =>
                        setField('summary', event.target.value)
                      }
                    />
                    <div
                      className={styles['preview-table']}
                      role="table"
                      aria-label="报告指标"
                    >
                      <div className={styles['preview-table-head']} role="row">
                        <span>指标</span>
                        <span>上期</span>
                        <span>本期</span>
                        <span>变化</span>
                      </div>
                      {options.metrics.map((metric, index) => (
                        <div
                          className={styles['preview-table-row']}
                          role="row"
                          key={index}
                        >
                          <span className={styles['metric-label-cell']}>
                            <input
                              aria-label={`指标 ${index + 1} 名称`}
                              maxLength={24}
                              value={metric.label}
                              onChange={(event) =>
                                setMetric(index, 'label', event.target.value)
                              }
                            />
                            <button
                              type="button"
                              title={`删除${metric.label || `指标 ${index + 1}`}`}
                              aria-label={`删除${metric.label || `指标 ${index + 1}`}`}
                              disabled={options.metrics.length === 1}
                              onClick={() => removeMetric(index)}
                            >
                              <Trash2 size={11} />
                            </button>
                          </span>
                          <span>
                            <input
                              aria-label={`${metric.label || `指标 ${index + 1}`} 上期`}
                              type="number"
                              min="0"
                              max="999999"
                              value={metric.previous}
                              onChange={(event) =>
                                setMetric(index, 'previous', event.target.value)
                              }
                            />
                          </span>
                          <span>
                            <input
                              aria-label={`${metric.label || `指标 ${index + 1}`} 本期`}
                              type="number"
                              min="0"
                              max="999999"
                              value={metric.current}
                              onChange={(event) =>
                                setMetric(index, 'current', event.target.value)
                              }
                            />
                          </span>
                          <span>
                            {metric.current - metric.previous >= 0 ? '+' : ''}
                            {metric.current - metric.previous}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      className={styles['add-metric']}
                      type="button"
                      disabled={options.metrics.length >= 6}
                      onClick={addMetric}
                    >
                      <Plus size={13} /> 添加指标
                    </button>
                    {options.chart && (
                      <>
                        <h4>趋势图表</h4>
                        <div
                          className={styles.chart}
                          role="img"
                          aria-label="上期与本期指标柱状图"
                        >
                          {options.metrics.map((metric, index) => (
                            <div className={styles['chart-group']} key={index}>
                              <div className={styles.bars}>
                                <span
                                  style={{
                                    height: `${Math.max(2, (metric.previous / scale) * 100)}%`,
                                  }}
                                />
                                <span
                                  style={{
                                    height: `${Math.max(2, (metric.current / scale) * 100)}%`,
                                  }}
                                />
                              </div>
                              <small>{metric.label}</small>
                            </div>
                          ))}
                        </div>
                        <div className={styles.legend}>
                          <span>上期</span>
                          <span>本期</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {previewPage === 'analysis' && (
                  <>
                    <h4>分析与建议</h4>
                    <textarea
                      className={styles['paper-analysis']}
                      aria-label="分析与建议正文"
                      rows={14}
                      value={options.analysis}
                      onChange={(event) =>
                        setField('analysis', event.target.value)
                      }
                    />
                  </>
                )}
              </div>
              <div className={styles['paper-footer']}>
                <span>{options.author}</span>
                <span>
                  {String(
                    previewPages.findIndex((page) => page.id === previewPage) +
                      1,
                  ).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
