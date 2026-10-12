export type ReportMetric = {
  label: string;
  previous: number;
  current: number;
};

export type ReportOptions = {
  title: string;
  subtitle: string;
  author: string;
  summary: string;
  analysis: string;
  metrics: ReportMetric[];
  paper: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margin: 'normal' | 'narrow';
  columns: 1 | 2;
  accent: string;
  shapeWidth: number;
  chart: boolean;
  watermark: boolean;
  watermarkText: string;
};

export async function buildDocxReport(options: ReportOptions) {
  const [docx, charts, shapes, watermarks, layout] = await Promise.all([
    import('docx'),
    import('docx/charts'),
    import('docx/shapes'),
    import('docx/watermarks'),
    import('docx/layout'),
  ]);

  const {
    AlignmentType,
    Document,
    Footer,
    Header,
    HeadingLevel,
    Packer,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docx;
  const { ChartRun } = charts;
  const { ShapeRun } = shapes;
  const { TextWatermark } = watermarks;
  const { estimatePageNumbersWith, layoutDocument } = layout;

  const pageSize = options.paper === 'a4' ? [11906, 16838] : [12240, 15840];
  const [shortSide, longSide] = pageSize;
  const landscape = options.orientation === 'landscape';
  const margin = options.margin === 'narrow' ? 900 : 1440;
  const sectionPage = {
    size: {
      width: landscape ? longSide : shortSide,
      height: landscape ? shortSide : longSide,
      orientation: landscape
        ? docx.PageOrientation.LANDSCAPE
        : docx.PageOrientation.PORTRAIT,
    },
    margin: {
      top: margin,
      right: margin,
      bottom: margin,
      left: margin,
      header: 540,
      footer: 540,
    },
  };
  const heading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 320, after: 160 },
    });
  const body = (text: string) =>
    new Paragraph({
      text,
      spacing: { after: 180, line: 340 },
    });
  const header = new Header({
    children: [
      new Paragraph({
        children: [
          ...(options.watermark
            ? [
                new TextWatermark({
                  text: options.watermarkText,
                  color: 'B8C9C6',
                  opacity: 0.22,
                }),
              ]
            : []),
          new TextRun({
            text: options.title,
            color: options.accent,
            bold: true,
            size: 18,
          }),
        ],
        border: {
          bottom: {
            color: 'DDE7E5',
            size: 5,
            space: 8,
            style: docx.BorderStyle.SINGLE,
          },
        },
      }),
    ],
  });
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${options.author}  ·  `,
            color: '60777B',
            size: 17,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: '60777B',
            size: 17,
          }),
        ],
      }),
    ],
  });

  const metricRows = [
    new TableRow({
      tableHeader: true,
      children: ['指标', '上期', '本期', '变化'].map(
        (label) =>
          new TableCell({
            shading: { fill: options.accent },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label, bold: true, color: 'FFFFFF' }),
                ],
              }),
            ],
          }),
      ),
    }),
    ...options.metrics.map(
      (metric) =>
        new TableRow({
          children: [
            metric.label,
            String(metric.previous),
            String(metric.current),
            `${metric.current - metric.previous >= 0 ? '+' : ''}${metric.current - metric.previous}`,
          ].map(
            (value) =>
              new TableCell({
                children: [
                  new Paragraph({
                    text: value,
                    spacing: { before: 80, after: 80 },
                  }),
                ],
              }),
          ),
        }),
    ),
  ];

  const chartWidth = landscape ? 570 : 460;
  const dataChildren = [
    heading('指标概览'),
    body(options.summary),
    new Table({
      rows: metricRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    ...(options.chart
      ? [
          heading('趋势图表'),
          new Paragraph({
            children: [
              new ChartRun({
                type: 'column',
                title: '上期与本期对比',
                categories: options.metrics.map((metric) => metric.label),
                series: [
                  {
                    name: '上期',
                    values: options.metrics.map((metric) => metric.previous),
                    color: 'B5C7C7',
                  },
                  {
                    name: '本期',
                    values: options.metrics.map((metric) => metric.current),
                    color: options.accent,
                  },
                ],
                transformation: { width: chartWidth, height: 260 },
                valueAxis: { gridlines: true },
              }),
            ],
          }),
        ]
      : []),
  ];

  const document = new Document({
    title: options.title,
    subject: options.subtitle,
    creator: options.author,
    pageNumbers: estimatePageNumbersWith({ guess: true }),
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 21, color: '24373B' } },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Arial', size: 27, bold: true, color: options.accent },
        },
      ],
    },
    sections: [
      {
        properties: { page: sectionPage },
        headers: { default: header },
        footers: { default: footer },
        children: [
          new Paragraph({
            spacing: { before: 1500, after: 260 },
            children: [
              new ShapeRun({
                type: 'rectangle',
                transformation: { width: options.shapeWidth, height: 7 },
                fill: options.accent,
                line: 'none',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                size: 48,
                color: '20333A',
              }),
            ],
            spacing: { after: 220 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: options.subtitle,
                size: 25,
                color: '59737A',
              }),
            ],
            spacing: { after: 520 },
          }),
          body(options.summary),
          new Paragraph({
            children: [
              new TextRun({
                text: options.author,
                color: options.accent,
                bold: true,
              }),
            ],
            spacing: { before: 600 },
          }),
        ],
      },
      {
        properties: { type: SectionType.NEXT_PAGE, page: sectionPage },
        headers: { default: header },
        footers: { default: footer },
        children: dataChildren,
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: sectionPage,
          column: {
            count: options.columns,
            space: 650,
            separate: options.columns === 2,
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: [
          heading('分析与建议'),
          ...options.analysis
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map(body),
        ],
      },
    ],
  });

  const preview = layoutDocument(document, { guess: true });
  return {
    blob: await Packer.toBlob(document),
    pages: preview.pages.length,
    estimated:
      preview.pages.some((page) => (page.guesses?.length ?? 0) > 0) ||
      Boolean(preview.stoppedAt),
  };
}
