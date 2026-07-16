import { useRef, useState, type FormEvent } from "react";
import { FormField } from "../../components/FormField";
import type { Role, UserProfile } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

interface UserFormProps {
  user?: UserProfile;
  onSaved?: () => void;
}

export function UserForm(props: UserFormProps) {
  return <UserFormFields key={props.user?.id ?? "new-user"} {...props} />;
}

function UserFormFields({ user, onSaved }: UserFormProps) {
  const { createUser, updateUser } = usePrototypeStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "commercial");
  const [active, setActive] = useState(user?.active ?? true);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : "Informe o nome.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Informe um e-mail válido.",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email) {
      if (nextErrors.name) nameRef.current?.focus();
      return;
    }
    const input = { name: name.trim(), email: email.trim(), role, active };
    if (user) updateUser({ ...input, id: user.id });
    else createUser(input);
    setSaved(true);
    onSaved?.();
  };

  return <form className="user-form" onSubmit={submit} noValidate>
    <FormField label="Nome" error={errors.name}><input ref={nameRef} value={name} onChange={(event) => setName(event.target.value)} /></FormField>
    <FormField label="E-mail" error={errors.email}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></FormField>
    <FormField label="Papel"><select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="admin">Administrador</option><option value="commercial">Comercial</option><option value="finance">Financeiro/Administrativo</option></select></FormField>
    <FormField label="Usuário ativo"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /></FormField>
    <button className="button-primary" type="submit">Salvar usuário</button>
    {saved && <p className="session-notice" role="status">Usuário {user ? "atualizado" : "criado"} somente nesta sessão.</p>}
  </form>;
}
