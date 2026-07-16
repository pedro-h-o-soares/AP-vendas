import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalFocus } from "./useModalFocus";

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
  const dialogRef = useRef<HTMLElement>(null);

  useModalFocus(open, onCancel, dialogRef, cancelRef);

  if (!open) return null;
  return createPortal(
    <div className="dialog-backdrop">
      <section
        ref={dialogRef}
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
    </div>,
    document.body,
  );
}
