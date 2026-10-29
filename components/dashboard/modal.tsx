'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  subtitle,
  busy = false,
  onClose,
  wide,
  labelledBy,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  busy?: boolean;
  onClose: () => void;
  wide?: boolean;
  labelledBy?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const first = root.querySelector<HTMLElement>(FOCUSABLE);
    (root.querySelector<HTMLElement>('input, select, textarea') || first)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        ref={ref}
        className={'modal' + (wide ? ' wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy || (typeof title === 'string' ? title : undefined)}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="close"
            aria-label="Fermer"
            disabled={busy}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
