import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "../viewmodels/AuthContext";
import Brand from "../components/Brand";
import LocalDemoAccessButton from "../local-demo/LocalDemoAccessButton";
export default function Login() {
  const { user, restoring, login, loginLocal } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { await login(email.trim(), senha); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  }
  if (user) return <Navigate to="/" replace />;
  if (restoring) return <div className="loading-state" role="status"><span className="spinner" /><p>Verificando sua sessão…</p></div>;
  return <main className="login-page">
    <section className="login-form-side" aria-labelledby="login-title">
      <Brand />
      <div className="login-form-content">
        <h1 id="login-title">Bem-vindo à<br /><strong>Fundação FCV</strong></h1>
        <p>Juntos por mais saúde,<br />qualidade de vida e cuidado.</p>
        <form onSubmit={submit} aria-busy={busy}>
          <label className="login-field"><span className="sr-only">E-mail</span>
            <div className="login-input"><UserRound size={24} /><input type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="Usuário (e-mail)" disabled={busy} /></div>
          </label>
          <label className="login-field"><span className="sr-only">Senha</span>
            <div className="login-input"><LockKeyhole size={24} /><input type={visible ? "text" : "password"} required autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Senha" disabled={busy} /><button type="button" className="icon-button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={23} /> : <Eye size={23} />}</button></div>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary login-submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}<ArrowRight size={23} /></button>
        </form>
        <LocalDemoAccessButton disabled={busy} onAccess={loginLocal} />
        <div className="login-security"><ShieldCheck size={29} /><span>Ambiente seguro</span></div>
      </div>
    </section>
    <section className="login-visual" aria-label="Juntos por mais saúde, qualidade de vida e cuidado.">
      <img src="/referencia-web/login-visual.webp" width={806} height={1024} decoding="async" alt="Colaboradora da FCV usando um computador, na fotografia da referência do portal." />
    </section>
  </main>;
}
