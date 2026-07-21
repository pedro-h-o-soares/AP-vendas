import { BarChart3, ShieldCheck, Truck, WalletCards } from "lucide-react";
import type { Role } from "../../domain/types";
import { useAuth } from "../../auth/AuthContext";

const profiles: { label: string; role: Role; description: string; icon: typeof ShieldCheck }[] = [
  { label: "Administrador", role: "admin", description: "Acesso completo para operação, finanças e usuários.", icon: ShieldCheck },
  { label: "Comercial", role: "commercial", description: "Pedidos, clientes, embarques e ocorrências.", icon: Truck },
  { label: "Financeiro", role: "finance", description: "Recebimentos, pagamentos, cheques e acertos.", icon: WalletCards },
];

export function LoginPage() {
  const { signIn } = useAuth();

  return (
    <main className="login-page" aria-labelledby="login-title">
      <section className="login-shell">
        <div className="login-hero">
          <span className="login-brand-mark" aria-hidden="true">O</span>
          <span className="page-eyebrow">Protótipo operacional</span>
          <h1 id="login-title">Ogura Rep</h1>
          <p>Escolha um perfil demonstrativo para acessar a plataforma de pedidos, cargas, ocorrências e financeiro.</p>
          <div className="login-insight" aria-label="Resumo do protótipo">
            <BarChart3 aria-hidden="true" size={20} />
            <span>Protótipo sem gravação permanente.</span>
          </div>
        </div>

        <div className="login-panel" aria-label="Perfis demonstrativos">
          <div className="login-panel__heading">
            <span className="page-eyebrow">Acesso rápido</span>
            <h2>Entrar no ambiente</h2>
          </div>
          <div className="login-profile-grid">
            {profiles.map(({ description, icon: Icon, label, role }) => (
              <button className="login-profile-card" key={role} onClick={() => signIn(role)} type="button">
                <span className="login-profile-card__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="login-profile-card__body">
                  <strong>Entrar como {label}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
