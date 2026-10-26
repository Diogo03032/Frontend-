import { Navigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound, ShieldCheck } from "lucide-react";
import { useLoginVM } from "../viewmodels/useLoginVM";
import PasswordRecovery from "./PasswordRecovery";
import Brand from "../components/Brand";
import LocalDemoAccessButton from "../local-demo/LocalDemoAccessButton";
import loginIllustration from "../images/login/Ilustraçãofcv.svg";
export default function Login() {
  const { user, restoring, loginLocal, email, setEmail, senha, setSenha, visible, setVisible, busy, error, recovering, setRecovering, submit, beginRecovery } = useLoginVM();
  if (user) return <Navigate to="/" replace />;
  if (restoring) return <div className="loading-state" role="status"><span className="spinner" /><p>Verificando sua sessão…</p></div>;
  return <main className="login-page">
    <section className="login-visual" aria-label="Fundação Cristiano Varella: cuidado e compromisso com a vida.">
      <img src={loginIllustration} width={3840} height={2160} decoding="async" alt="" />
    </section>
    <section className="login-form-side" aria-labelledby="login-title">
      <div className="login-panel">
        <Brand />
        <div className="login-form-content">
          {recovering ? <PasswordRecovery defaultEmail={email} onBack={() => setRecovering(false)} /> : <>
          <h1 id="login-title">Acesse sua conta</h1>
          <p>Entre com seus dados para continuar.</p>
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
          <button className="login-forgot" type="button" onClick={beginRecovery}>Esqueci minha senha</button>
          <LocalDemoAccessButton disabled={busy} onAccess={loginLocal} />
          </>}
          <div className="login-security"><ShieldCheck size={29} /><span>Ambiente seguro</span></div>
        </div>
      </div>
    </section>
  </main>;
}
