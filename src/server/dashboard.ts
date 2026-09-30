import 'server-only';

export const regions = [
  { id: 'all', label: '全部地区' },
  { id: 'east', label: '华东' },
  { id: 'south', label: '华南' },
  { id: 'north', label: '华北' },
] as const;

export const periods = [
  { id: 'today', label: '今日' },
  { id: 'week', label: '近 7 天' },
  { id: 'month', label: '近 30 天' },
] as const;

export type Region = (typeof regions)[number]['id'];
export type Period = (typeof periods)[number]['id'];

const regionFactor: Record<Region, number> = {
  all: 1,
  east: 0.37,
  south: 0.29,
  north: 0.21,
};

const periodFactor: Record<Period, number> = {
  today: 1,
  week: 6.7,
  month: 27.4,
};

const baseSeries = [36, 58, 44, 72, 61, 83, 69];
const monthSegments = [
  '1–4 日',
  '5–8 日',
  '9–12 日',
  '13–16 日',
  '17–20 日',
  '21–25 日',
  '26–30 日',
];

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSummary(region: Region, period: Period) {
  await pause(350);
  const factor = regionFactor[region] * periodFactor[period];
  const requests = Math.round(128 * factor);
  return {
    requests,
    revenue: Math.round(46800 * factor),
    completion: `${Math.max(91.2, 96.8 - (region === 'north' ? 2.4 : 0) - (period === 'month' ? 0.8 : 0)).toFixed(1)}%`,
  };
}

export async function getTrend(region: Region, period: Period) {
  await pause(850);
  const factor =
    regionFactor[region] *
    (period === 'month' ? 1.18 : period === 'week' ? 1.08 : 1);
  return baseSeries.map((value, index) => ({
    label:
      period === 'today'
        ? `${9 + index * 2}:00`
        : period === 'week'
          ? `第 ${index + 1} 天`
          : monthSegments[index],
    value: Math.round(value * factor),
    width: Math.max(12, Math.round(value * (0.7 + factor * 0.3))),
  }));
}

export async function getAlerts(region: Region) {
  await pause(1350);
  const label = regions.find((item) => item.id === region)?.label ?? '全部地区';
  return [
    {
      id: 'queue',
      level: 'high',
      label: '高',
      title: `${label}待处理请求上升`,
      detail: '建议检查审批队列与响应时间。',
    },
    {
      id: 'stock',
      level: 'medium',
      label: '中',
      title: '部分商品库存偏低',
      detail: '补货任务已进入运营队列。',
    },
    {
      id: 'sync',
      level: 'low',
      label: '低',
      title: '报表同步完成',
      detail: '最后一次同步由服务端生成。',
    },
  ];
}
