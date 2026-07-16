import type { Role } from "../../domain/types";
import { useAuth } from "../../auth/AuthContext";

const profiles: { label: string; role: Role }[] = [
  { label: "Administrador", role: "admin" },
  { label: "Comercial", role: "commercial" },
  { label: "Financeiro", role: "finance" },
];

export function LoginPage() {
  const { signIn } = useAuth();

  return (
    <main>
      <h1>Ogura Rep</h1>
      <p>Escolha um perfil demonstrativo para entrar.</p>
      <p>Protótipo sem gravação permanente</p>
      {profiles.map(({ label, role }) => (
        <button key={role} onClick={() => signIn(role)} type="button">
          Entrar como {label}
        </button>
      ))}
    </main>
  );
}
