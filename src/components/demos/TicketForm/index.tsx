'use client';

import { useActionState } from 'react';
import { Paperclip } from 'lucide-react';
import { createTicket, type TicketFormState } from '../../../server/actions';
import { SubmitButton } from '../SubmitButton';
import styles from './index.module.scss';

const initialState: TicketFormState = { ok: false, message: '' };

export function TicketForm() {
  const [state, action, pending] = useActionState(createTicket, initialState);
  return (
    <form action={action} className={styles.form}>
      <div className={styles.row}>
        <label className={styles.field}>
          标题
          <input
            name="title"
            minLength={4}
            maxLength={80}
            placeholder="例如：审批队列未及时刷新"
            required
          />
        </label>
        <label className={styles.field}>
          优先级
          <select name="priority" defaultValue="中">
            <option>低</option>
            <option>中</option>
            <option>高</option>
          </select>
        </label>
      </div>
      <label className={styles.field}>
        问题描述
        <textarea
          name="description"
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="描述复现步骤和预期结果..."
          required
        />
      </label>
      <div className={styles.footer}>
        <label className={styles.attachment}>
          <Paperclip size={15} /> 附件
          <input type="file" name="attachment" accept=".txt,.png,.pdf" />
        </label>
        <span>TXT / PNG / PDF，最大 1 MB</span>
        <SubmitButton label="创建工单" />
      </div>
      {state.message && (
        <p className={state.ok ? styles.success : styles.error} role="status">
          {state.message}
        </p>
      )}
      {pending && <span className={styles.pending}>服务端正在校验...</span>}
    </form>
  );
}
