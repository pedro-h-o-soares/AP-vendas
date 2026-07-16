import { useEffect, useRef, type ReactNode } from "react";

interface DrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ title, open, onClose, children }: DrawerProps) {
  const titleId = `drawer-${title.toLowerCase().replace(/\W+/g, "-")}`;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previousFocus?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Fechar ${title}`}>×</button>
        </header>
        <div className="drawer__content">{children}</div>
      </aside>
    </div>
  );
}
