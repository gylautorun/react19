import styles from './index.module.scss';

export function SectionTitle({
  index,
  title,
  detail,
}: {
  index: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className={styles['section-title']}>
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}
