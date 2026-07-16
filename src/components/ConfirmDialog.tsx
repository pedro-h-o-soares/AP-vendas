import { useEffect, useId, useRef, type ReactNode } from "react";

interface ConfirmDialogProps {
  title: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
}

export function ConfirmDialog({
  title,
  open,
  onCancel,
  onConfirm,
  children,
  confirmLabel = "Confirmar",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previousFocus?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId}>{children}</div>
        <footer className="confirm-dialog__actions">
          <button ref={cancelRef} type="button" onClick={onCancel}>Cancelar</button>
          <button className="button-primary" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </section>
    </div>
  );
}
