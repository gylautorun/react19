'use client';
import { useFormStatus } from 'react-dom';
import styles from './index.module.scss';

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={styles['primary-button']}
      type="submit"
      disabled={pending}
    >
      {pending ? '提交中...' : label}
    </button>
  );
}
