import { SubmitButton } from '../../components/demos/SubmitButton';
import { TicketForm } from '../../components/demos/TicketForm';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { changeTicketStatus, createNote } from '../../server/actions';
import { getServerNotes, getTickets } from '../../server/data';
import styles from './index.module.scss';

export function ActionPage() {
  const notes = getServerNotes();
  const tickets = getTickets();
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="03 / 数据变更"
        title="Server Actions"
        description="提交会调用 'use server' 函数，服务端更新后随 RSC 响应返回新列表。表单支持无 JavaScript 提交。"
        badge="真实服务端调用"
      />
      <SectionTitle
        index="实验 A"
        title="给服务器留一条便签"
        detail="输入 1–100 个字符，提交后观察下方记录变化。"
      />
      <div className={styles['action-layout']}>
        <div className={styles['surface']}>
          <form action={createNote} className={styles['note-form']}>
            <label htmlFor="note">便签内容</label>
            <div className={styles['form-row']}>
              <input
                id="note"
                name="note"
                placeholder="例如：RSC 在服务端执行..."
                minLength={1}
                maxLength={100}
                required
              />
              <SubmitButton label="提交便签" />
            </div>
          </form>
          <div className={styles['list-heading']}>
            <strong>服务端记录</strong>
            <span>{notes.length} 条</span>
          </div>
          <div className={styles['note-list']}>
            {notes.map((note) => (
              <div className={styles['note-item']} key={note.id}>
                <span className={styles['note-pin']} />
                <p>{note.text}</p>
                <time>{note.time}</time>
              </div>
            ))}
          </div>
        </div>
        <div className={styles['side-explain']}>
          <div className={styles['step']}>
            <span>1</span>
            <div>
              <strong>浏览器提交 FormData</strong>
              <p>React 调用服务端函数引用。</p>
            </div>
          </div>
          <div className={styles['step']}>
            <span>2</span>
            <div>
              <strong>服务端更新数据</strong>
              <p>
                <code>createNote</code> 在服务器进程运行。
              </p>
            </div>
          </div>
          <div className={styles['step']}>
            <span>3</span>
            <div>
              <strong>新 RSC 树返回</strong>
              <p>记录列表由服务端重新生成。</p>
            </div>
          </div>
          <a
            href="/actions?__nojs"
            target="_blank"
            rel="noreferrer"
            className={styles['text-link']}
          >
            查看无 JavaScript 版本 ↗
          </a>
        </div>
      </div>
      <SectionTitle
        index="实验 B"
        title="提交并处理工单"
        detail="服务端校验标题、描述、优先级和附件；提交及状态变化都会返回新的 RSC 列表。"
      />
      <TicketForm />
      <div className={styles['ticket-list']}>
        <div className={styles['list-heading']}>
          <strong>工单队列</strong>
          <span>
            {tickets.filter((ticket) => ticket.status === '待处理').length}{' '}
            条待处理
          </span>
        </div>
        {tickets.map((ticket) => (
          <div className={styles['ticket-row']} key={ticket.id}>
            <div className={styles['ticket-main']}>
              <div className={styles['ticket-title']}>
                <strong>
                  #{ticket.id} {ticket.title}
                </strong>
                <span
                  className={
                    ticket.status === '已完成'
                      ? styles['ticket-done']
                      : styles['ticket-open']
                  }
                >
                  {ticket.status}
                </span>
                <span className={styles['ticket-priority']}>
                  {ticket.priority}优先级
                </span>
              </div>
              <p>{ticket.description}</p>
              <small>
                {ticket.time}
                {ticket.attachment &&
                  ` · 附件 ${ticket.attachment.name} (${Math.ceil(ticket.attachment.size / 1024)} KB) · SHA-256 ${ticket.attachment.digest}…`}
              </small>
            </div>
            <form action={changeTicketStatus}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <SubmitButton
                label={ticket.status === '待处理' ? '标记完成' : '重新打开'}
              />
            </form>
          </div>
        ))}
      </div>
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>生产环境提示</h3>
          <p>
            示例数据放在进程内存中，附件只读取摘要且不保存内容。真实项目需要数据库、鉴权、文件存储与多实例一致性。
          </p>
        </div>
        <CodeBlock
          file="src/server/actions.tsx"
          code="'use server'\n\nexport async function createNote(formData: FormData) {\n  const text = String(formData.get('note') ?? '').trim()\n  if (text) addServerNote(text)\n}"
        />
      </div>
    </div>
  );
}
