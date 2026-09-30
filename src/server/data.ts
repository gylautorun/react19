import 'server-only';

type Note = { id: number; text: string; time: string };

export type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: '低' | '中' | '高';
  status: '待处理' | '已完成';
  attachment?: { name: string; size: number; digest: string };
  time: string;
};

const data = {
  notes: [
    { id: 1, text: '这条记录由服务端生成。', time: '初始数据' },
    {
      id: 2,
      text: '提交表单后，列表会通过新的 RSC 响应刷新。',
      time: '初始数据',
    },
  ] as Note[],
  reactions: { helpful: 18, examples: 9, unclear: 3 },
  tickets: [
    {
      id: 1,
      title: '验证生产环境的 RSC 缓存策略',
      description: '检查数据更新后各区域是否按预期刷新。',
      priority: '高',
      status: '待处理',
      time: '初始数据',
    },
  ] as Ticket[],
  nextTicketId: 2,
};

export function getServerNotes() {
  return data.notes.toReversed();
}

export function addServerNote(text: string) {
  data.notes.push({
    id: Date.now(),
    text,
    time: new Date().toLocaleTimeString('zh-CN'),
  });
}

export type Reaction = keyof typeof data.reactions;

export function getReactions() {
  return { ...data.reactions };
}

export function addReaction(kind: Reaction) {
  data.reactions[kind] += 1;
  return getReactions();
}

export function getTickets() {
  return data.tickets.toReversed();
}

export function addTicket(ticket: Omit<Ticket, 'id' | 'status' | 'time'>) {
  data.tickets.push({
    ...ticket,
    id: data.nextTicketId++,
    status: '待处理',
    time: new Date().toLocaleTimeString('zh-CN'),
  });
}

export function toggleTicket(id: number) {
  const ticket = data.tickets.find((item) => item.id === id);
  if (!ticket) return;
  ticket.status = ticket.status === '待处理' ? '已完成' : '待处理';
}
