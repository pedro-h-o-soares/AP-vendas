import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalFocus } from "./useModalFocus";

interface DrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ title, open, onClose, children }: DrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useModalFocus(open, onClose, drawerRef, closeRef);

  if (!open) return null;
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={drawerRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Fechar ${title}`}>×</button>
        </header>
        <div className="drawer__content">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
