import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Dùng thẻ <dialog> gốc: tự có focus trap, ESC để đóng, trả focus về nút đã mở. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // autoFocus của React không tác dụng khi dialog chưa mở; focus thủ công vào trường đánh dấu.
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="dialog-body">
          <div className="dialog-head">
            <h2 id="dialog-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
              <IconClose />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
