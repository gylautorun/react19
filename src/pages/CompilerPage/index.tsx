import { CompilerDemo } from '../../components/demos/CompilerDemo';
import { CompilerIdentityDemo } from '../../components/demos/CompilerIdentityDemo';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { PageTitle } from '../../components/ui/PageTitle';
import { SectionTitle } from '../../components/ui/SectionTitle';
import styles from './index.module.scss';

export function CompilerPage() {
  return (
    <div className={styles['page']}>
      <PageTitle
        eyebrow="01 / 编译优化"
        title="React Compiler"
        description="先在商品目录里组合筛选与对比，再观察对象和函数 props 如何影响 memo 子组件的更新。"
        badge="构建时启用"
      />
      <SectionTitle
        index="实验 A"
        title="多条件商品目录与无关更新"
        detail="筛选和排序没有手写 useMemo；可用 React DevTools Profiler 对照不同操作的提交。"
      />
      <CompilerDemo />
      <SectionTitle
        index="实验 B"
        title="对象、函数与 memo 子组件"
        detail="连续更新无关计数，对比未缓存、手动缓存和编译优化三种情况下的子组件提交次数。"
      />
      <CompilerIdentityDemo />
      <div className={styles['learning-grid']}>
        <div className={styles['info-panel']}>
          <h3>为什么比较这三组</h3>
          <p>
            传统写法用 <code>useMemo</code> 保持对象引用、用{' '}
            <code>useCallback</code> 保持函数引用，让 <code>memo</code>{' '}
            子组件跳过无关更新。未缓存和手动缓存两组通过{' '}
            <code>'use no memo'</code> 关闭编译优化作对照；第三组不写缓存
            Hook。开发模式下 StrictMode
            可能使首次挂载计两次，重点观察点击后的增量。
          </p>
        </div>
        <CodeBlock
          file="src/components/demos/CompilerIdentityDemo/index.tsx"
          code={`// 未缓存：每次父组件更新都创建新引用
const options = { label: '库存提醒', threshold: 24 };
const onToggle = () => setSelected(value => !value);

// 手动缓存：关闭 Compiler 后使用两个 Hook
const options = useMemo(() => ({ label: '库存提醒', threshold: 24 }), []);
const onToggle = useCallback(() => setSelected(value => !value), []);

// Compiler：与未缓存组写法相同，由编译器缓存引用
// 三组都把 options 和 onToggle 传给 memo 子组件`}
        />
      </div>
    </div>
  );
}
