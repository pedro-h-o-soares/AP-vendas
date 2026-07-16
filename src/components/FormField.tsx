import { cloneElement, useId, type ReactElement } from "react";

interface FormFieldProps {
  label: string;
  children: ReactElement<Record<string, unknown>>;
  hint?: string;
  error?: string;
}

export function FormField({ label, children, hint, error }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = (children.props.id as string | undefined) ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [children.props["aria-describedby"], hint && hintId, error && errorId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      {cloneElement(children, {
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? "true" : undefined,
      })}
      {hint && <span className="form-field__hint" id={hintId}>{hint}</span>}
      {error && <span className="form-field__error" id={errorId}>{error}</span>}
    </div>
  );
}
