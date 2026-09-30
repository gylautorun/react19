export const records = Array.from({ length: 12000 }, (_, index) => ({
  id: index + 1,
  name: `${['订单', '用户', '报表', '商品', '任务', '文档'][index % 6]} ${String(index + 1).padStart(5, '0')}`,
  group: ['华东', '华南', '华北', '西部'][index % 4],
  status: ['正常', '待审核', '异常'][
    index % 11 === 0 ? 2 : index % 5 === 0 ? 1 : 0
  ],
  latency: 32 + ((index * 37) % 480),
}));
