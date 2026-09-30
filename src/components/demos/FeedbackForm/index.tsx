'use client';

import { useActionState, useState } from 'react';
import { Check } from 'lucide-react';
import { submitFeedback, type FeedbackState } from '../../../server/actions';
import { SubmitButton } from '../SubmitButton';
import styles from './index.module.scss';

const initialState: FeedbackState = { ok: false, message: '', errors: {} };

export function FeedbackForm() {
  const [state, action, pending] = useActionState(submitFeedback, initialState);
  const [length, setLength] = useState(0);

  return (
    <div className={[styles['surface'], styles['feedback-surface']].join(' ')}>
      <form action={action} className={styles['feedback-form']}>
        <div className={styles['field-row']}>
          <div className={styles.field}>
            <label htmlFor="feedback-name">称呼</label>
            <input
              id="feedback-name"
              name="name"
              placeholder="你的名字"
              minLength={2}
              maxLength={40}
              aria-invalid={Boolean(state.errors.name)}
              required
            />
            {state.errors.name && (
              <small className={styles['field-error']}>
                {state.errors.name}
              </small>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="feedback-topic">讨论主题</label>
            <select
              id="feedback-topic"
              name="topic"
              defaultValue=""
              aria-invalid={Boolean(state.errors.topic)}
              required
            >
              <option value="" disabled>
                选择主题
              </option>
              <option value="Compiler">React Compiler</option>
              <option value="RSC">Server Components</option>
              <option value="Actions">Server Actions</option>
              <option value="Hooks">异步 Hooks</option>
            </select>
            {state.errors.topic && (
              <small className={styles['field-error']}>
                {state.errors.topic}
              </small>
            )}
          </div>
        </div>
        <fieldset className={styles.rating}>
          <legend>内容评分</legend>
          <div className={styles['rating-row']}>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value}>
                <input type="radio" name="rating" value={value} required />
                {value} 分
              </label>
            ))}
          </div>
          {state.errors.rating && (
            <small className={styles['field-error']}>
              {state.errors.rating}
            </small>
          )}
        </fieldset>
        <div className={styles.field}>
          <label htmlFor="feedback-message">留言</label>
          <textarea
            id="feedback-message"
            name="message"
            rows={4}
            placeholder="写下场景、你尝试的做法，以及希望弄清楚的问题..."
            minLength={20}
            maxLength={300}
            onChange={(event) => setLength(event.target.value.length)}
            aria-invalid={Boolean(state.errors.message)}
            required
          />
          <div className={styles.counter}>
            <small>{state.errors.message}</small>
            <span>{length}/300</span>
          </div>
        </div>
        <div className={styles['form-footer']}>
          <SubmitButton label="发送留言" />
          <span>
            useActionState pending：<b>{pending ? 'true' : 'false'}</b>
          </span>
        </div>
      </form>
      {state.message && (
        <div
          className={[
            styles['form-message'],
            styles[state.ok ? 'success' : 'error'],
          ].join(' ')}
          role="status"
        >
          {state.ok && <Check size={17} />}
          {state.message}
        </div>
      )}
    </div>
  );
}
