'use client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  Code2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { navigationGroups } from '../../config/navigation';
import styles from './index.module.scss';

export function AppShell({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const current = navigationGroups
    .flatMap((group) => group.items)
    .find((item) => item.path === path);

  return (
    <div
      className={[
        styles['app-layout'],
        collapsed && styles['sidebar-collapsed'],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {menuOpen && (
        <button
          className={styles['mobile-scrim']}
          aria-label="关闭导航"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={[styles['sidebar'], menuOpen && styles['mobile-open']]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles['brand-row']}>
          <a
            href="/"
            className={styles['brand']}
            onClick={() => setMenuOpen(false)}
            aria-label="React 19 实验台首页"
          >
            <span className={styles['brand-mark']}>
              <Code2 size={20} strokeWidth={2.2} />
            </span>
            <span className={styles['brand-copy']}>
              <strong>React Lab</strong>
              <small>19 · 交互实验台</small>
            </span>
          </a>
          <button
            className={[styles['icon-button'], styles['sidebar-toggle']].join(
              ' ',
            )}
            title={collapsed ? '展开侧栏' : '收起侧栏'}
            aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <button
            className={[styles['icon-button'], styles['mobile-close']].join(
              ' ',
            )}
            title="关闭导航"
            aria-label="关闭导航"
            onClick={() => setMenuOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className={styles['sidebar-body']}>
          {navigationGroups.map((group) => (
            <div className={styles['nav-group']} key={group.label}>
              <div className={styles['nav-label']}>{group.label}</div>
              {group.items.map(({ path: itemPath, title, icon: Icon }) => (
                <a
                  key={itemPath}
                  className={[
                    styles['nav-link'],
                    itemPath === path && styles['active'],
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  href={itemPath}
                  title={title}
                  aria-current={itemPath === path ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  <span>{title}</span>
                  {itemPath === path && (
                    <ChevronRight size={15} className={styles['nav-chevron']} />
                  )}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={styles['sidebar-footer']}>
          <div className={styles['version-dot']} />
          <span>React 19.3 · Vite 8</span>
        </div>
      </aside>
      <div className={styles['workspace']}>
        <header className={styles['topbar']}>
          <div className={styles['topbar-left']}>
            <button
              className={[styles['icon-button'], styles['mobile-menu']].join(
                ' ',
              )}
              title="打开导航"
              aria-label="打开导航"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className={styles['topbar-root']}>实验台</span>
            <ChevronRight size={15} className={styles['topbar-chevron']} />
            <strong>{current?.title ?? '未找到页面'}</strong>
          </div>
          <div className={styles['topbar-right']}>
            <span className={styles['topbar-status']}>
              <span /> 本地运行中
            </span>
            <a
              className={styles['docs-link']}
              href="https://react.dev/reference/react"
              target="_blank"
              rel="noreferrer"
            >
              React 文档 <ArrowUpRight size={15} />
            </a>
          </div>
        </header>
        <main className={styles['content']}>{children}</main>
      </div>
    </div>
  );
}
