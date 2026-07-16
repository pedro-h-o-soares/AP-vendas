import type { ReactNode } from "react";

type AsyncStateProps =
  | { status: "loading"; loadingMessage?: string }
  | { status: "error"; error: string; onRetry: () => void }
  | { status: "empty"; emptyMessage: string }
  | { status: "ready"; children: ReactNode };

export function AsyncState(props: AsyncStateProps) {
  if (props.status === "loading") {
    return <p className="async-state" role="status">{props.loadingMessage ?? "Carregando…"}</p>;
  }
  if (props.status === "error") {
    return (
      <div className="async-state async-state--error" role="alert">
        <p>{props.error}</p>
        <button type="button" onClick={props.onRetry}>Tentar novamente</button>
      </div>
    );
  }
  if (props.status === "empty") {
    return <p className="async-state" role="status">{props.emptyMessage}</p>;
  }
  return props.children;
}
