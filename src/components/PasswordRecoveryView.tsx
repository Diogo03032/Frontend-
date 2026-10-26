import { ArrowLeft, ArrowRight } from "lucide-react";
import type { usePasswordRecoveryVM } from "../viewmodels/usePasswordRecoveryVM";

type Props = ReturnType<typeof usePasswordRecoveryVM>;

export default function PasswordRecoveryView(props: Props) {
  const { step, email, code, password, busy, error, isDone, title, description, action, back, setEmail, setCode, setPassword, submit, goBack } = props;
  return <section className="login-recovery">
    <h1>{title}</h1><p>{description}</p>
    {!isDone && <form onSubmit={submit} aria-busy={busy}>
      {step === "email" && <input aria-label="E-mail" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail" disabled={busy} />}
      {step === "code" && <input aria-label="Código de 6 dígitos" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} placeholder="Código de 6 dígitos" disabled={busy} />}
      {step === "password" && <input aria-label="Nova senha" type="password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="Nova senha (mínimo 8 caracteres)" disabled={busy} />}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-primary login-submit" disabled={busy}>{busy ? "Aguarde…" : action}<ArrowRight size={20} /></button>
    </form>}
    <button className="login-recovery-back" type="button" onClick={goBack}><ArrowLeft size={18} />{back}</button>
  </section>;
}