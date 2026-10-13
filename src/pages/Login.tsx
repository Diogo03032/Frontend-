import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  HeartHandshake,
  Users,
  Gift,
} from "lucide-react";
import { useAuth, demoEnabled } from "../viewmodels/AuthContext";
import Brand from "../components/Brand";
export default function Login() {
  const { user, restoring, login, demo } = useAuth();
  const [email, setEmail] = useState(""),
    [senha, setSenha] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [role, setRole] = useState<"admin" | "operador">("admin");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), senha);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  if (user) return <Navigate to="/" replace />;
  if (restoring)
    return (
      <div className="loading-state">
        <span className="spinner" />
        <p>Verificando sua sessão…</p>
      </div>
    );
  return (
    <main className="login-page">
      <section className="login-form-side">
        <Brand />
        <div className="login-form-content">
          <span className="eyebrow">PORTAL DE GESTÃO</span>
          <h1>
            Bem-vindo à<br />
            <strong>Fundação FCV.</strong>
          </h1>
          <p>
            Mais cuidado, mais possibilidades.
            <br />
            Gerencie os benefícios de quem faz parte da nossa história.
          </p>
          <form onSubmit={submit}>
            <label className="field">
              <span>E-mail</span>
              <div className="login-input">
                <Mail size={20} />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@fcv.org.br"
                />
              </div>
            </label>
            <label className="field">
              <span>Senha</span>
              <div className="login-input">
                <LockKeyhole size={20} />
                <input
                  type={visible ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary login-submit" disabled={busy}>
              {busy ? "Entrando…" : "Entrar no portal"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-security">
            <ShieldCheck size={18} />
            Acesso exclusivo à equipe da Fundação
          </div>
          {demoEnabled && (
            <div className="demo-entry">
              <p>Conheça o portal com dados de exemplo</p>
              <div>
                <select
                  aria-label="Perfil da demonstração"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "admin" | "operador")
                  }
                >
                  <option value="admin">Administrador FCV</option>
                  <option value="operador">Operador FCV</option>
                </select>
                <button
                  className="btn btn-secondary"
                  onClick={() => demo(role)}
                >
                  Explorar demonstração <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
        <footer>Fundação Cristiano Varella · Pela vida.</footer>
      </section>
      <section className="login-visual">
        <div className="login-visual-top">
          <span className="brand-symbol">
            <HeartHandshake size={25} />
          </span>
          <span>CUIDAR É CONECTAR</span>
        </div>
        <h2>
          Juntos por mais saúde,
          <br />
          qualidade de vida
          <br />e <em>cuidado.</em>
        </h2>
        <p>
          Uma plataforma para aproximar pessoas,
          <br />
          fortalecer parcerias e ampliar possibilidades.
        </p>
        <div className="login-illustration">
          <div className="visual-stat">
            <span className="stat-icon green">
              <Users size={24} />
            </span>
            <div>
              <small>Pessoas em primeiro lugar</small>
              <strong>Cuidado que transforma</strong>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="visual-benefit">
            <Gift size={32} />
            <span>BENEFÍCIOS E RELACIONAMENTO</span>
            <h3>
              Mais oportunidades.
              <br />
              Uma só Fundação.
            </h3>
            <div className="visual-tags">
              <span>Saúde</span>
              <span>Bem-estar</span>
              <span>Cultura</span>
            </div>
          </div>
          <div className="visual-note">
            <div className="avatar">FCV</div>
            <span>
              Ao lado de quem cuida,
              <br />
              <strong>em cada momento.</strong>
            </span>
          </div>
        </div>
        <span className="login-visual-footer">PELA VIDA, TODOS OS DIAS.</span>
      </section>
    </main>
  );
}
