import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <section>
      <h1>Acesso negado</h1>
      <p>Seu perfil não possui permissão para acessar esta área.</p>
      <Link to="/dashboard">Voltar ao dashboard</Link>
    </section>
  );
}
