import { LitElement, css, html, type PropertyValues } from 'lit';

export type HealthPoint = {
  label: string;
  tick: string;
  coverage: number;
  stability: number;
};

export type TrendSelectEvent = CustomEvent<{
  index: number;
  point: HealthPoint;
}>;

export class LabHealthChart extends LitElement {
  static override properties = {
    points: { attribute: false },
    selectedIndex: { type: Number, attribute: 'selected-index' },
    accent: { type: String },
  };

  declare points: readonly HealthPoint[];
  declare selectedIndex: number;
  declare accent: string;

  private hoverIndex: number | null = null;
  private resizeObserver?: ResizeObserver;
  private drawFrame = 0;

  constructor() {
    super();
    this.points = [];
    this.selectedIndex = 0;
    this.accent = '#087f75';
  }

  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      color: #263a42;
      font: inherit;
    }

    .chart {
      border: 1px solid #dce6e6;
      border-radius: 6px;
      background: #fff;
      padding: 18px 18px 12px;
    }

    .heading,
    .legend,
    .readout {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .heading strong {
      font-size: 14px;
    }

    .heading span,
    .legend,
    .readout {
      color: #667a82;
      font-size: 11px;
    }

    .legend {
      justify-content: flex-start;
      gap: 18px;
      margin-top: 14px;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend i {
      display: inline-block;
      width: 14px;
      height: 3px;
      border-radius: 2px;
      background: var(--chart-accent, #087f75);
    }

    .legend .stability {
      background: #c17b37;
    }

    canvas {
      display: block;
      width: 100%;
      height: 265px;
      margin-top: 4px;
      cursor: crosshair;
      touch-action: pan-y;
    }

    canvas:focus-visible {
      outline: 2px solid var(--chart-accent, #087f75);
      outline-offset: 2px;
    }

    .readout {
      justify-content: flex-start;
      flex-wrap: wrap;
      border-top: 1px solid #edf1f2;
      padding-top: 11px;
    }

    .readout strong {
      color: #263a42;
      font-size: 12px;
    }

    @media (width <= 480px) {
      .chart {
        padding: 14px 12px 11px;
      }

      canvas {
        height: 220px;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    const canvas = this.renderRoot.querySelector('canvas');
    if (canvas) this.resizeObserver?.observe(canvas);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.drawFrame);
  }

  protected override firstUpdated() {
    const canvas = this.renderRoot.querySelector('canvas');
    if (canvas && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleDraw());
      this.resizeObserver.observe(canvas);
    }
  }

  protected override updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('points') && this.hoverIndex !== null) {
      this.hoverIndex = null;
      this.requestUpdate();
    }
    this.scheduleDraw();
  }

  private scheduleDraw() {
    cancelAnimationFrame(this.drawFrame);
    this.drawFrame = requestAnimationFrame(() => this.draw());
  }

  private xAt(index: number, left: number, width: number) {
    return left + (index / Math.max(1, this.points.length - 1)) * width;
  }

  private indexAt(clientX: number, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const left = 38;
    const width = Math.max(1, rect.width - left - 16);
    return Math.max(
      0,
      Math.min(
        this.points.length - 1,
        Math.round(
          ((clientX - rect.left - left) / width) * (this.points.length - 1),
        ),
      ),
    );
  }

  private drawLine(
    context: CanvasRenderingContext2D,
    key: 'coverage' | 'stability',
    color: string,
    left: number,
    top: number,
    width: number,
    height: number,
  ) {
    context.beginPath();
    this.points.forEach((point, index) => {
      const x = this.xAt(index, left, width);
      const y = top + (1 - point[key] / 100) * height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.stroke();
  }

  private draw() {
    const canvas = this.renderRoot.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    const left = 38;
    const top = 18;
    const plotWidth = Math.max(1, width - left - 16);
    const plotHeight = height - top - 34;

    context.font = '10px sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    [0, 25, 50, 75, 100].forEach((value) => {
      const y = top + (1 - value / 100) * plotHeight;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(left + plotWidth, y);
      context.strokeStyle = '#e9eff0';
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = '#819198';
      context.fillText(String(value), left - 8, y);
    });

    if (this.points.length === 0) return;

    context.textAlign = 'center';
    context.textBaseline = 'top';
    const tickStep = Math.max(1, Math.ceil((this.points.length - 1) / 5));
    this.points.forEach((point, index) => {
      if (
        index !== this.points.length - 1 &&
        (index % tickStep !== 0 || this.points.length - 1 - index < tickStep)
      )
        return;
      context.fillStyle = '#819198';
      context.fillText(
        point.tick,
        this.xAt(index, left, plotWidth),
        height - 22,
      );
    });

    context.beginPath();
    this.points.forEach((point, index) => {
      const x = this.xAt(index, left, plotWidth);
      const y = top + (1 - point.coverage / 100) * plotHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.lineTo(left + plotWidth, top + plotHeight);
    context.lineTo(left, top + plotHeight);
    context.closePath();
    context.fillStyle = this.accent;
    context.globalAlpha = 0.08;
    context.fill();
    context.globalAlpha = 1;

    this.drawLine(
      context,
      'coverage',
      this.accent,
      left,
      top,
      plotWidth,
      plotHeight,
    );
    this.drawLine(
      context,
      'stability',
      '#c17b37',
      left,
      top,
      plotWidth,
      plotHeight,
    );

    const index = Math.max(
      0,
      Math.min(this.points.length - 1, this.hoverIndex ?? this.selectedIndex),
    );
    const point = this.points[index];
    const x = this.xAt(index, left, plotWidth);
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, top + plotHeight);
    context.strokeStyle = '#aababc';
    context.lineWidth = 1;
    context.setLineDash([3, 4]);
    context.stroke();
    context.setLineDash([]);

    for (const [key, color] of [
      ['coverage', this.accent],
      ['stability', '#c17b37'],
    ] as const) {
      const y = top + (1 - point[key] / 100) * plotHeight;
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fillStyle = '#fff';
      context.fill();
      context.lineWidth = 2.5;
      context.strokeStyle = color;
      context.stroke();
    }
  }

  private select(index: number) {
    const point = this.points[index];
    if (!point) return;
    this.dispatchEvent(
      new CustomEvent('trend-select', {
        detail: { index, point },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handlePointerMove(event: PointerEvent) {
    const canvas = event.currentTarget as HTMLCanvasElement;
    const index = this.indexAt(event.clientX, canvas);
    if (index !== this.hoverIndex) {
      this.hoverIndex = index;
      this.requestUpdate();
    }
  }

  private handlePointerLeave() {
    this.hoverIndex = null;
    this.requestUpdate();
  }

  private handleClick(event: MouseEvent) {
    const canvas = event.currentTarget as HTMLCanvasElement;
    canvas.focus();
    this.select(this.indexAt(event.clientX, canvas));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.points.length === 0) return;
    let index = Math.max(
      0,
      Math.min(this.points.length - 1, this.selectedIndex),
    );
    if (event.key === 'ArrowLeft') index -= 1;
    else if (event.key === 'ArrowRight') index += 1;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = this.points.length - 1;
    else return;
    event.preventDefault();
    this.hoverIndex = null;
    this.select(Math.max(0, Math.min(this.points.length - 1, index)));
  }

  override render() {
    const selectedIndex = Math.max(
      0,
      Math.min(this.points.length - 1, this.selectedIndex),
    );
    const index = Math.max(
      0,
      Math.min(this.points.length - 1, this.hoverIndex ?? selectedIndex),
    );
    const point = this.points[index];
    return html`
      <div class="chart">
        <div class="heading">
          <strong>组件接入趋势</strong>
          <span>模拟数据</span>
        </div>
        <div class="legend">
          <span><i></i>接入覆盖率</span>
          <span><i class="stability"></i>运行稳定率</span>
        </div>
        <canvas
          tabindex=${this.points.length ? '0' : '-1'}
          role="slider"
          aria-label="选择趋势日期"
          aria-valuemin="1"
          aria-valuemax=${Math.max(1, this.points.length)}
          aria-valuenow=${selectedIndex + 1}
          aria-valuetext=${this.points[selectedIndex]?.label ?? '暂无数据'}
          @pointermove=${this.handlePointerMove}
          @pointerleave=${this.handlePointerLeave}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        ></canvas>
        <div class="readout" aria-live="polite">
          <strong>${point?.label ?? '暂无数据'}</strong>
          <span>覆盖 ${point?.coverage ?? 0}%</span>
          <span>稳定 ${point?.stability ?? 0}%</span>
        </div>
      </div>
    `;
  }
}

if (
  typeof customElements !== 'undefined' &&
  !customElements.get('lab-health-chart')
) {
  customElements.define('lab-health-chart', LabHealthChart);
}
