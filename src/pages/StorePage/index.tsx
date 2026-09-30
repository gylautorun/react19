import { StoreDemo } from '../../components/demos/StoreDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function StorePage() {
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="06 / 共享状态"
        title="Zustand 状态管理"
        description="用一个小型 Store 管理任务和学习进度；返回概览页后，进度摘要读取同一份客户端状态。"
        badge="Zustand 5"
      />
      <SectionTitle
        index="实验"
        title="学习清单"
        detail="新增任务、切换完成状态，观察统计即时更新。"
      />
      <StoreDemo />
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>状态放在哪里</h3>
          <p>
            组件内短暂状态继续用 <code>useState</code>；跨路由客户端状态交给
            Zustand。服务端数据仍由 RSC/Action 管理。
          </p>
        </div>
        <CodeBlock
          file="src/store/useLabStore.ts"
          code="export const useLabStore = create<LabStore>((set) => ({\n  tasks: initialTasks,\n  toggleTask: id => set(state => ({\n    tasks: state.tasks.map(task =>\n      task.id === id ? { ...task, done: !task.done } : task\n    )\n  }))\n}))"
        />
      </div>
    </div>
  );
}
