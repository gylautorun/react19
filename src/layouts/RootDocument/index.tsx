import { Suspense, type ReactNode } from 'react';
import { AppShell } from '../AppShell';
import styles from './index.module.scss';

export function RootDocument({
  path,
  title,
  children,
}: {
  path: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f6f8fb" />
        <title>{`${title} · React 19 实验台`}</title>
      </head>
      <body>
        <AppShell path={path}>
          <Suspense
            fallback={
              <div className={styles['loading-block']}>
                正在加载服务端内容...
              </div>
            }
          >
            {children}
          </Suspense>
        </AppShell>
      </body>
    </html>
  );
}
