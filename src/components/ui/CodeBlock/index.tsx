import { GitBranch } from 'lucide-react';
import styles from './index.module.scss';

export function CodeBlock({ code, file }: { code: string; file: string }) {
  return (
    <div className={styles['code-block']}>
      <div className={styles['code-header']}>
        <span>
          <GitBranch size={14} /> {file} · 摘要
        </span>
        <span>TSX</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
