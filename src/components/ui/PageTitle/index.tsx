import { Layers3 } from 'lucide-react';
import styles from './index.module.scss';

export function PageTitle({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className={styles['page-heading']}>
      <div className={styles['eyebrow']}>
        <Layers3 size={14} /> {eyebrow}
      </div>
      <div className={styles['heading-line']}>
        <h1>{title}</h1>
        {badge && <span className={styles['heading-badge']}>{badge}</span>}
      </div>
      <p>{description}</p>
    </div>
  );
}
