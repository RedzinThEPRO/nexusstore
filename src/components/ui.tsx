import { type ReactNode } from 'react';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5" style={{ fontSize: size }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? 'text-accent-400' : i === full && half ? 'text-accent-400/60' : 'text-ink-500'}>
          {i < full ? '★' : i === full && half ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

export function Badge({ children, variant = 'muted' }: { children: ReactNode; variant?: 'neon' | 'accent' | 'success' | 'danger' | 'warning' | 'muted' }) {
  const cls = {
    neon: 'chip-neon', accent: 'chip-accent', success: 'chip-success',
    danger: 'chip-danger', warning: 'chip-warning', muted: 'chip-muted',
  }[variant];
  return <span className={cls}>{children}</span>;
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-ink-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {desc && <p className="mt-1 text-sm text-ink-300 max-w-md">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-ink-600 border-t-neon-400 ${className}`}
      style={{ width: 20, height: 20 }} />
  );
}

export function Modal({ open, onClose, children, title, wide }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-strong rounded-2xl shadow-card w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-ink-300 hover:text-white text-xl leading-none">×</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-200">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  const color = type === 'error' ? 'border-danger-500/40 bg-danger-500/10' : type === 'info' ? 'border-neon-500/40 bg-neon-500/10' : 'border-success-500/40 bg-success-500/10';
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-in">
      <div className={`glass-strong rounded-xl border ${color} px-5 py-3 shadow-card flex items-center gap-3`}>
        <span className="text-sm text-white">{message}</span>
        <button onClick={onClose} className="text-ink-300 hover:text-white text-sm">✕</button>
      </div>
    </div>
  );
}
