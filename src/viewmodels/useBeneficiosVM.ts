import { useState, type FormEvent } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { conveniadoNome, formatMoney } from "../models/selectors";
import type { Beneficio } from "../models/types";

const PAGE_SIZE = 8;

export type BeneficioForm = {
  nome: string;
  descricao: string;
  status: Beneficio["status"];
  tipo_beneficio: Beneficio["tipo_beneficio"];
  valor: string;
  quantidade_maxima_utilizacoes: string;
  tipo_janela: Beneficio["tipo_janela"];
  unidade_ciclo: NonNullable<Beneficio["unidade_ciclo"]>;
  dia_reset: string;
  intervalo_valor: string;
  intervalo_unidade: NonNullable<Beneficio["intervalo_unidade"]>;
  referencia_contagem: NonNullable<Beneficio["referencia_contagem"]>;
};

const blankForm = (): BeneficioForm => ({
  nome: "",
  descricao: "",
  status: "ATIVO",
  tipo_beneficio: "PERCENTUAL",
  valor: "",
  quantidade_maxima_utilizacoes: "1",
  tipo_janela: "CALENDARIO_FIXO",
  unidade_ciclo: "MES",
  dia_reset: "",
  intervalo_valor: "30",
  intervalo_unidade: "DIA",
  referencia_contagem: "ULTIMA_UTILIZACAO",
});

export function ruleSummary(item: Beneficio) {
  const count = `${item.quantidade_maxima_utilizacoes} ${item.quantidade_maxima_utilizacoes === 1 ? "utilização" : "utilizações"}`;
  if (item.tipo_janela === "CALENDARIO_FIXO")
    return `${count} por ${item.unidade_ciclo === "ANO" ? "ano" : item.unidade_ciclo === "SEMANA" ? "semana" : "mês"}`;
  const unit =
    item.intervalo_unidade === "MES"
      ? item.intervalo_valor === 1
        ? "mês"
        : "meses"
      : item.intervalo_valor === 1
        ? "dia"
        : "dias";
  return `${count} a cada ${item.intervalo_valor} ${unit}`;
}

export function valueSummary(item: Beneficio) {
  return item.tipo_beneficio === "PERCENTUAL"
    ? `${Number(item.valor).toLocaleString("pt-BR")}%`
    : formatMoney(Number(item.valor));
}

export function useBeneficiosVM() {
  const { data, save, loading } = usePortal();
  const { notify } = useToast();

  // ── Filtros ──
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("buscar") ?? "",
  );
  const [status, setStatus] = useState("");
  const [windowType, setWindowType] = useState("");
  const [page, setPage] = useState(1);

  // ── Modais / formulário ──
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficio>();
  const [details, setDetails] = useState<Beneficio>();
  const [discontinuing, setDiscontinuing] = useState<Beneficio>();
  const [linking, setLinking] = useState<Beneficio>();
  const [selectedPartner, setSelectedPartner] = useState("");
  const [form, setForm] = useState<BeneficioForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Dados derivados ──
  const filtered = data.beneficios.filter(
    (item) =>
      (!status || item.status === status) &&
      (!windowType || item.tipo_janela === windowType) &&
      `${item.nome} ${item.descricao ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );

  const visibleRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeOffers = (id: number) =>
    data.ofertas.filter(
      (item) => item.beneficio_id === id && item.status === "ATIVO",
    );

  const linkedOffers = linking
    ? data.ofertas.filter((item) => item.beneficio_id === linking.id)
    : [];

  const availablePartners = data.conveniados.filter(
    (partner) =>
      partner.status === "ATIVO" &&
      !linkedOffers.some(
        (item) => item.conveniado_id === partner.id && item.status === "ATIVO",
      ),
  );

  // ── Ações ──
  function openForm(item?: Beneficio) {
    setEditing(item);
    setForm(
      item
        ? {
            nome: item.nome,
            descricao: item.descricao ?? "",
            status: item.status,
            tipo_beneficio: item.tipo_beneficio,
            valor: String(item.valor),
            quantidade_maxima_utilizacoes: String(
              item.quantidade_maxima_utilizacoes,
            ),
            tipo_janela: item.tipo_janela,
            unidade_ciclo: item.unidade_ciclo ?? "MES",
            dia_reset: item.dia_reset?.slice(0, 10) ?? "",
            intervalo_valor: String(item.intervalo_valor ?? 30),
            intervalo_unidade: item.intervalo_unidade ?? "DIA",
            referencia_contagem:
              item.referencia_contagem ?? "ULTIMA_UTILIZACAO",
          }
        : blankForm(),
    );
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const value = Number(form.valor);
    const count = Number(form.quantidade_maxima_utilizacoes);
    const interval = Number(form.intervalo_valor);
    if (!form.nome.trim()) {
      setFormError("Informe o nome do benefício.");
      return;
    }
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (form.tipo_beneficio === "PERCENTUAL" && value > 100)
    ) {
      setFormError(
        "Informe um valor maior que zero. O desconto percentual deve ser de até 100%.",
      );
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      setFormError(
        "O limite de utilizações deve ser um número inteiro maior que zero.",
      );
      return;
    }
    if (
      form.tipo_janela === "JANELA_MOVEL" &&
      (!Number.isInteger(interval) || interval < 1)
    ) {
      setFormError(
        "O intervalo de renovação deve ser um número inteiro maior que zero.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const fixed = form.tipo_janela === "CALENDARIO_FIXO";
      await save("beneficios", editing?.id, {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        status: form.status,
        tipo_beneficio: form.tipo_beneficio,
        valor: value,
        quantidade_maxima_utilizacoes: count,
        tipo_janela: form.tipo_janela,
        unidade_ciclo: fixed ? form.unidade_ciclo : null,
        dia_reset: fixed && form.dia_reset ? form.dia_reset : null,
        intervalo_valor: fixed ? null : interval,
        intervalo_unidade: fixed ? null : form.intervalo_unidade,
        referencia_contagem: fixed ? null : form.referencia_contagem,
      });
      notify(
        editing
          ? "Benefício atualizado."
          : "Benefício cadastrado. Vincule os conveniados para disponibilizar as ofertas.",
      );
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o benefício.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function discontinue() {
    if (!discontinuing) return;
    setSubmitting(true);
    try {
      await save("beneficios", discontinuing.id, { status: "DESCONTINUADO" });
      notify(
        "Benefício descontinuado. As ofertas e o histórico foram preservados.",
      );
      setDiscontinuing(undefined);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível descontinuar.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function linkPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linking || !selectedPartner) return;
    setSubmitting(true);
    setFormError("");
    try {
      const existing = linkedOffers.find(
        (item) => item.conveniado_id === Number(selectedPartner),
      );
      await save("ofertas", existing?.id, {
        beneficio_id: linking.id,
        conveniado_id: Number(selectedPartner),
        status: "ATIVO",
      });
      notify(
        existing
          ? "Oferta reativada para o conveniado."
          : "Conveniado vinculado ao benefício.",
      );
      setSelectedPartner("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível vincular o conveniado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeOffer(id: number, nextStatus: "ATIVO" | "INATIVO") {
    setSubmitting(true);
    setFormError("");
    try {
      await save("ofertas", id, { status: nextStatus });
      notify(
        nextStatus === "ATIVO"
          ? "Oferta reativada."
          : "Conveniado desvinculado. O histórico da oferta foi preservado.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a oferta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    // contexto
    data,
    loading,
    PAGE_SIZE,

    // filtros
    search,
    setSearch,
    status,
    setStatus,
    windowType,
    setWindowType,
    page,
    setPage,

    // dados derivados
    filtered,
    currentPage,
    visibleRows,
    activeOffers,
    linkedOffers,
    availablePartners,

    // formulário
    formOpen,
    setFormOpen,
    editing,
    form,
    setForm,
    formError,
    setFormError,
    submitting,
    openForm,
    submit,

    // detalhes
    details,
    setDetails,

    // descontinuação
    discontinuing,
    setDiscontinuing,
    discontinue,

    // conveniados
    linking,
    setLinking,
    selectedPartner,
    setSelectedPartner,
    linkPartner,
    changeOffer,

    // helpers
    conveniadoNome,
  };
}
