import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from "../services/api";

export default function PasswordRecovery({ onBack, defaultEmail = "" }: { onBack: () => void; defaultEmail?: string }) {
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState(defaultEmail), [code, setCode] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      if (step === "email") { const result = await requestPasswordReset(email.trim()); if (import.meta.env.DEV) console.info("[recuperação de senha] Código de teste:", { email, codigo: result.codigo }); setStep("code"); return; }
      if (step === "code") { await verifyPasswordResetCode(email.trim(), code); setStep("password"); return; }
      await resetPassword(email.trim(), code, password); setStep("done");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível redefinir a senha."); }
    finally { setBusy(false); }
  }
  return <section className="login-recovery"><h1>{step === "done" ? "Senha redefinida" : "Esqueci minha senha"}</h1><p>{step === "email" ? "Informe seu e-mail. No teste local, o código aparece no console do navegador." : step === "code" ? "Digite o código de seis dígitos para validá-lo." : step === "password" ? "Código confirmado. Escolha uma nova senha." : "Sua senha foi alterada. Volte ao login para entrar."}</p>
    {step !== "done" && <form onSubmit={submit} aria-busy={busy}>{step === "email" && <input aria-label="E-mail" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" disabled={busy}/>}
      {step === "code" && <input aria-label="Código de 6 dígitos" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="Código de 6 dígitos" disabled={busy}/>}
      {step === "password" && <input aria-label="Nova senha" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha (mínimo 8 caracteres)" disabled={busy}/>}
      {error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary login-submit" disabled={busy}>{busy ? "Aguarde…" : step === "email" ? "Enviar código" : step === "code" ? "Validar código" : "Salvar nova senha"}<ArrowRight size={20}/></button></form>}
    <button className="login-recovery-back" type="button" onClick={() => step === "email" || step === "done" ? onBack() : (setStep("email"), setCode(""), setPassword(""), setError(""))}><ArrowLeft size={18}/>{step === "email" || step === "done" ? "Voltar ao login" : "Não recebeu? Voltar e informar o e-mail"}</button>
  </section>;
}
