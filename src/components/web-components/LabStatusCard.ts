import { LitElement, css, html } from 'lit';

export type StatusTone = 'healthy' | 'attention' | 'critical';
export type StatusMetric = { label: string; value: string };
export type StatusActionEvent = CustomEvent<{
  heading: string;
  status: StatusTone;
}>;

const statusLabels: Record<StatusTone, string> = {
  healthy: '运行正常',
  attention: '需要关注',
  critical: '需要处理',
};

export class LabStatusCard extends LitElement {
  static override properties = {
    heading: { type: String },
    status: { type: String, reflect: true },
    metrics: { attribute: false },
    acknowledgements: { type: Number },
  };

  declare heading: string;
  declare status: StatusTone;
  declare metrics: readonly StatusMetric[];
  declare acknowledgements: number;

  constructor() {
    super();
    this.heading = '组件交付状态';
    this.status = 'healthy';
    this.metrics = [];
    this.acknowledgements = 0;
  }

  static override styles = css`
    :host {
      display: block;
      color: #22343a;
      font: inherit;
    }

    .card {
      border: 1px solid #dce6e6;
      border-top: 4px solid var(--lab-accent, #087f75);
      border-radius: 6px;
      background: white;
      padding: 22px;
      box-shadow: 0 8px 26px rgb(30 54 56 / 6%);
    }

    .top,
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .eyebrow {
      color: #72858b;
      font-size: 11px;
      font-weight: 700;
    }

    .status {
      border-radius: 4px;
      padding: 5px 8px;
      background: #e9f5f1;
      color: #147c68;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    :host([status='attention']) .status {
      background: #fff3d9;
      color: #925f00;
    }

    :host([status='critical']) .status {
      background: #fdeae8;
      color: #ad4239;
    }

    h3 {
      margin: 18px 0 20px;
      font-size: 18px;
      line-height: 1.35;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border-top: 1px solid #ebf0f0;
      border-bottom: 1px solid #ebf0f0;
      padding: 17px 0;
      gap: 12px;
    }

    .metric {
      display: grid;
      gap: 5px;
    }

    .metric span {
      color: #74868c;
      font-size: 10px;
    }

    .metric strong {
      color: #253b41;
      font-size: 16px;
      overflow-wrap: anywhere;
    }

    .footer {
      margin-top: 18px;
    }

    .note {
      color: #7a8b90;
      font-size: 11px;
      line-height: 1.5;
    }

    button {
      flex: none;
      border: 0;
      border-radius: 4px;
      background: var(--lab-accent, #087f75);
      color: white;
      padding: 9px 12px;
      font: inherit;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      filter: brightness(0.9);
    }

    @media (width <= 420px) {
      .card {
        padding: 17px;
      }

      .footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;

  private handleAction() {
    this.dispatchEvent(
      new CustomEvent('status-action', {
        detail: { heading: this.heading, status: this.status },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <section class="card" aria-label=${this.heading}>
        <div class="top">
          <span class="eyebrow"><slot name="eyebrow">设计系统组件</slot></span>
          <span class="status">${statusLabels[this.status]}</span>
        </div>
        <h3>${this.heading}</h3>
        <div class="metrics">
          ${this.metrics.map(
            (metric) => html`
              <div class="metric">
                <span>${metric.label}</span>
                <strong>${metric.value}</strong>
              </div>
            `,
          )}
        </div>
        <div class="footer">
          <span class="note">
            <slot name="note">已确认 ${this.acknowledgements} 次</slot>
          </span>
          <button part="action" type="button" @click=${this.handleAction}>
            确认状态
          </button>
        </div>
      </section>
    `;
  }
}

if (
  typeof customElements !== 'undefined' &&
  !customElements.get('lab-status-card')
) {
  customElements.define('lab-status-card', LabStatusCard);
}
