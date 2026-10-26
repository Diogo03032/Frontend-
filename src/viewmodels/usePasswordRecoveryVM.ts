import { useState, type FormEvent } from "react";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "../services/api";

type Step = "email" | "code" | "password" | "done";

const content: Record<Step, { title: string; description: string; action: string; back: string }> = {
  email: {
    title: "Esqueci minha senha",
    description: "Informe seu e-mail. No teste local, o código aparece no console do navegador.",
    action: "Enviar código",
    back: "Voltar ao login",
  },
  code: {
    title: "Esqueci minha senha",
    description: "Digite o código de seis dígitos para validá-lo.",
    action: "Validar código",
    back: "Não recebeu? Voltar e informar o e-mail",
  },
  password: {
    title: "Esqueci minha senha",
    description: "Código confirmado. Escolha uma nova senha.",
    action: "Salvar nova senha",
    back: "Não recebeu? Voltar e informar o e-mail",
  },
  done: {
    title: "Senha redefinida",
    description: "Sua senha foi alterada. Volte ao login para entrar.",
    action: "",
    back: "Voltar ao login",
  },
};

export function usePasswordRecoveryVM({
  onBack,
  defaultEmail = "",
}: {
  onBack: () => void;
  defaultEmail?: string;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (step === "email") {
        const result = await requestPasswordReset(email.trim());
        if (import.meta.env.DEV)
          console.info("[recuperação de senha] Código de teste:", {
            email,
            codigo: result.codigo,
          });
        setStep("code");
      } else if (step === "code") {
        await verifyPasswordResetCode(email.trim(), code);
        setStep("password");
      } else if (step === "password") {
        await resetPassword(email.trim(), code, password);
        setStep("done");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (step === "email" || step === "done") onBack();
    else {
      setStep("email");
      setCode("");
      setPassword("");
      setError("");
    }
  }

  return {
    step,
    email,
    code,
    password,
    busy,
    error,
    isDone: step === "done",
    ...content[step],
    setEmail,
    setCode: (value: string) => setCode(value.replace(/\D/g, "")),
    setPassword,
    submit,
    goBack,
  };
}