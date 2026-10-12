import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MessageSquare, PanelTopOpen, X } from 'lucide-react';
import styles from './index.module.scss';

const subscribeStatic = () => () => {};

export function NativeUiDemo() {
  const popoverRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const popoverSupported = useSyncExternalStore(
    subscribeStatic,
    () => typeof HTMLElement.prototype.showPopover === 'function',
    () => null,
  );
  const dialogSupported = useSyncExternalStore(
    subscribeStatic,
    () => typeof HTMLDialogElement.prototype.showModal === 'function',
    () => null,
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastResult, setLastResult] = useState('尚无操作');

  useEffect(() => {
    const popover = popoverRef.current;
    const dialog = dialogRef.current;
    const onToggle = () =>
      setPopoverOpen(popover?.matches(':popover-open') ?? false);
    const onClose = () => {
      setDialogOpen(false);
      setLastResult(`对话框返回值：${dialog?.returnValue || '取消'}`);
    };
    popover?.addEventListener('toggle', onToggle);
    dialog?.addEventListener('close', onClose);
    return () => {
      popover?.removeEventListener('toggle', onToggle);
      dialog?.removeEventListener('close', onClose);
    };
  }, []);

  function togglePopover() {
    const popover = popoverRef.current;
    if (popoverSupported && popover) {
      if (popover.matches(':popover-open')) popover.hidePopover();
      else popover.showPopover();
    } else setPopoverOpen((open) => !open);
  }

  function openDialog() {
    if (dialogSupported) dialogRef.current?.showModal();
    else setDialogOpen(true);
  }

  function closeDialog(value: string) {
    if (dialogSupported) dialogRef.current?.close(value);
    else {
      setDialogOpen(false);
      setLastResult(`对话框返回值：${value}`);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <h2>Popover 与 Dialog</h2>
          <p>体验浏览器管理的顶层浮层、轻触关闭和模态焦点。</p>
        </div>
      </div>
      <div className={styles['metric-grid']}>
        <div className={styles.metric}>
          <span>Popover API</span>
          <strong>{popoverSupported ? '原生可用' : '降级显示'}</strong>
          <small>非模态，支持浏览器轻触关闭</small>
        </div>
        <div className={styles.metric}>
          <span>HTMLDialogElement</span>
          <strong>{dialogSupported ? '原生可用' : '降级显示'}</strong>
          <small>模态对话框与 returnValue</small>
        </div>
        <div className={styles.metric}>
          <span>最近返回值</span>
          <strong>{lastResult}</strong>
          <small>Esc 会取消原生对话框</small>
        </div>
      </div>
      <div className={styles.actions} style={{ marginTop: 20 }}>
        <button
          className={styles.button}
          type="button"
          aria-expanded={popoverOpen}
          onClick={togglePopover}
        >
          <PanelTopOpen size={15} /> 打开 Popover
        </button>
        <button
          className={styles['secondary-button']}
          type="button"
          onClick={openDialog}
        >
          <MessageSquare size={15} /> 打开 Dialog
        </button>
      </div>
      <div
        ref={popoverRef}
        className={styles.popover}
        popover={popoverSupported ? 'auto' : undefined}
        hidden={!popoverSupported && !popoverOpen}
      >
        <strong>原生弹出层</strong>
        <p>浏览器把它放在顶层；点击外部或按 Esc 可关闭。</p>
        <button
          className={styles['secondary-button']}
          type="button"
          onClick={togglePopover}
        >
          <X size={13} /> 关闭
        </button>
      </div>
      <dialog ref={dialogRef} className={styles.dialog}>
        <h3>确认发布</h3>
        <p>该对话框由浏览器管理焦点和背景交互。</p>
        <div className={styles.actions}>
          <button
            className={styles['secondary-button']}
            type="button"
            onClick={() => closeDialog('取消')}
          >
            取消
          </button>
          <button
            className={styles.button}
            type="button"
            onClick={() => closeDialog('确认')}
          >
            确认
          </button>
        </div>
      </dialog>
      {!dialogSupported && dialogOpen && (
        <div className={styles['fallback-backdrop']}>
          <div className={styles.dialog} role="dialog" aria-modal="true">
            <h3>确认发布</h3>
            <p>当前浏览器使用普通对话框降级。</p>
            <div className={styles.actions}>
              <button
                className={styles['secondary-button']}
                type="button"
                onClick={() => closeDialog('取消')}
              >
                取消
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => closeDialog('确认')}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
