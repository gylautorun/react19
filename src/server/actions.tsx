'use server';

import {
  addReaction,
  addServerNote,
  addTicket,
  getServerNotes,
  toggleTicket,
  type Reaction,
} from './data';

export async function createNote(formData: FormData) {
  const text = String(formData.get('note') ?? '').trim();
  if (text.length > 0 && text.length <= 100) addServerNote(text);
}

export async function submitFeedback(
  _previous: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  const name = String(formData.get('name') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const topic = String(formData.get('topic') ?? '');
  const rating = Number(formData.get('rating'));
  const errors: FeedbackState['errors'] = {};
  if (name.length < 2 || name.length > 40)
    errors.name = '称呼需要 2–40 个字符。';
  if (!['Compiler', 'RSC', 'Actions', 'Hooks'].includes(topic))
    errors.topic = '请选择讨论主题。';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    errors.rating = '请选择 1–5 分。';
  if (message.length < 20 || message.length > 300)
    errors.message = '留言需要 20–300 个字符。';
  if (Object.keys(errors).length)
    return { ok: false, message: '请检查标记的字段。', errors };
  addServerNote(`${name} · ${topic} · ${rating} 分：${message}`);
  return {
    ok: true,
    message: `已提交到服务端，当前共有 ${getServerNotes().length} 条记录。`,
    errors: {},
  };
}

export type FeedbackState = {
  ok: boolean;
  message: string;
  errors: Partial<Record<'name' | 'topic' | 'rating' | 'message', string>>;
};

export async function voteReaction(kind: Reaction, simulateFailure: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 750));
  if (!['helpful', 'examples', 'unclear'].includes(kind))
    throw new Error('无效的投票选项。');
  if (simulateFailure) throw new Error('模拟网络失败，乐观结果已回退。');
  return addReaction(kind);
}

export type TicketFormState = { ok: boolean; message: string };

export async function createTicket(
  _previous: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priority = String(formData.get('priority') ?? '中');
  if (title.length < 4 || title.length > 80)
    return { ok: false, message: '标题需要 4–80 个字符。' };
  if (description.length < 10 || description.length > 500)
    return { ok: false, message: '描述需要 10–500 个字符。' };
  if (!['低', '中', '高'].includes(priority))
    return { ok: false, message: '无效的优先级。' };

  const file = formData.get('attachment');
  let attachment: { name: string; size: number; digest: string } | undefined;
  if (file instanceof File && file.size > 0) {
    const extension = file.name.split('.').at(-1)?.toLowerCase();
    if (!['txt', 'png', 'pdf'].includes(extension ?? ''))
      return { ok: false, message: '附件仅支持 TXT、PNG、PDF。' };
    if (file.size > 1024 * 1024)
      return { ok: false, message: '附件不能超过 1 MB。' };
    const hash = await crypto.subtle.digest(
      'SHA-256',
      await file.arrayBuffer(),
    );
    attachment = {
      name: file.name.slice(0, 80),
      size: file.size,
      digest: Array.from(new Uint8Array(hash))
        .slice(0, 4)
        .map((value) => value.toString(16).padStart(2, '0'))
        .join(''),
    };
  }

  addTicket({
    title,
    description,
    priority: priority as '低' | '中' | '高',
    attachment,
  });
  return { ok: true, message: '工单已提交，列表由服务端重新生成。' };
}

export async function changeTicketStatus(formData: FormData) {
  const id = Number(formData.get('ticketId'));
  if (Number.isSafeInteger(id) && id > 0) toggleTicket(id);
}
