import { ConcurrentDemo } from '../../components/demos/ConcurrentDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function ConcurrentPage() {
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="05 / 响应优先级"
        title="并发渲染"
        description="在 2k–12k 条记录上组合查询、地区、状态和排序，同时保持输入响应和结果分页。"
        badge="useDeferredValue · useTransition"
      />
      <SectionTitle
        index="实验"
        title="多维运营记录筛选"
        detail="快速输入关键词，再切换地区、状态、排序和数据规模，观察待更新状态与分页结果。"
      />
      <ConcurrentDemo />
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>关键区别</h3>
          <p>
            <code>useDeferredValue</code> 延后消费变化的值；
            <code>useTransition</code>{' '}
            标记状态更新为非紧急。它们不会减少计算量，也不能替代虚拟列表或 Web
            Worker。
          </p>
        </div>
        <CodeBlock
          file="src/components/demos/ConcurrentDemo/index.tsx"
          code="const deferredQuery = useDeferredValue(query)\nconst [pending, startTransition] = useTransition()\n\nstartTransition(() => {\n  setGroup(nextGroup)\n  setPage(1)\n})"
        />
      </div>
    </div>
  );
}
