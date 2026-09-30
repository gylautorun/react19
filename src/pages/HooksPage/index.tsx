import { FeedbackForm } from '../../components/demos/FeedbackForm';
import { OptimisticDemo } from '../../components/demos/OptimisticDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { getReactions } from '../../server/data';
import styles from './index.module.scss';

export function HooksPage() {
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="04 / 异步交互"
        title="React 19 异步 Hooks"
        description="一个表单返回字段级错误；另一处投票先更新界面，再等待服务端确认或回退。"
        badge="useActionState · useOptimistic"
      />
      <SectionTitle
        index="实验 A"
        title="带字段校验的服务端表单"
        detail="选择主题和评分，填写留言；服务端会校验每个字段并返回错误状态。"
      />
      <FeedbackForm />
      <SectionTitle
        index="实验 B"
        title="多选项乐观投票与失败回退"
        detail="点击后立即更新票数；打开“模拟服务端失败”后再投一次，观察结果回退。"
      />
      <OptimisticDemo initialReactions={getReactions()} />
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>选择合适的 Hook</h3>
          <p>
            <code>useActionState</code> 管理 Action 返回值；
            <code>useFormStatus</code> 适合放在表单子组件；
            <code>useOptimistic</code>{' '}
            在网络请求期间展示预期结果，失败后自动回到已确认状态。
          </p>
        </div>
        <CodeBlock
          file="src/components/demos/"
          code="const [state, formAction, pending] =\n  useActionState(submitFeedback, initialState)\n\nconst [optimistic, addVote] =\n  useOptimistic(counts, (current, kind) => ({\n    ...current, [kind]: current[kind] + 1\n  }))"
        />
      </div>
    </div>
  );
}
