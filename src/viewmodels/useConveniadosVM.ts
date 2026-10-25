import { useState, type FormEvent } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { conveniadoDaUtilizacao, formatCnpj } from "../models/selectors";
import type { Conveniado } from "../models/types";

const PAGE_SIZE = 8;

export type ConveniadoForm = {
  usuario_id: string;
  nome_fantasia: string;
  razao_social: string;
  categoria: string;
  cnpj: string;
  endereco: string;
  status: Conveniado["status"];
};

const blankForm = (): ConveniadoForm => ({
  usuario_id: "",
  nome_fantasia: "",
  razao_social: "",
  categoria: "",
  cnpj: "",
  endereco: "",
  status: "EM_ANALISE",
});

export function useConveniadosVM() {
  const { data, save, loading } = usePortal();
  const { notify } = useToast();

  // ── Filtros ──
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("buscar") ?? "",
  );
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // ── Modais / formulário ──
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Conveniado>();
  const [details, setDetails] = useState<Conveniado>();
  const [inactivating, setInactivating] = useState<Conveniado>();
  const [form, setForm] = useState<ConveniadoForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Dados derivados ──
  const categories = [
    ...new Set(data.conveniados.map((item) => item.categoria)),
  ].sort();

  const availableUsers = data.usuarios.filter(
    (user) =>
      (user.id === editing?.usuario_id ||
        data.perfis.find((profile) => profile.id === user.perfil_id)?.escopo ===
          "CONVENIADO") &&
      !data.conveniados.some(
        (item) => item.usuario_id === user.id && item.id !== editing?.id,
      ),
  );

  const filtered = data.conveniados.filter((item) => {
    const text =
      `${item.nome_fantasia} ${item.razao_social} ${item.cnpj} ${formatCnpj(item.cnpj)} ${item.categoria} ${item.endereco}`.toLocaleLowerCase(
        "pt-BR",
      );
    return (
      (!status || item.status === status) &&
      (!category || item.categoria === category) &&
      text.includes(search.trim().toLocaleLowerCase("pt-BR"))
    );
  });

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );

  const visibleRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const activeOfferCount = (id: number) =>
    data.ofertas.filter(
      (item) => item.conveniado_id === id && item.status === "ATIVO",
    ).length;

  // ── Ações ──
  function openForm(item?: Conveniado) {
    setEditing(item);
    setForm(
      item
        ? {
            usuario_id: String(item.usuario_id),
            nome_fantasia: item.nome_fantasia,
            razao_social: item.razao_social,
            categoria: item.categoria,
            cnpj: formatCnpj(item.cnpj),
            endereco: item.endereco,
            status: item.status,
          }
        : blankForm(),
    );
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const cnpj = form.cnpj.replace(/\D/g, "");
    if (!form.usuario_id) {
      setFormError("Selecione o usuário responsável por este conveniado.");
      return;
    }
    if (cnpj.length !== 14) {
      setFormError("Informe um CNPJ com 14 dígitos.");
      return;
    }
    if (
      [
        form.nome_fantasia,
        form.razao_social,
        form.categoria,
        form.endereco,
      ].some((value) => !value.trim())
    ) {
      setFormError("Preencha os campos obrigatórios com dados válidos.");
      return;
    }
    if (
      data.conveniados.some(
        (item) =>
          item.id !== editing?.id && item.cnpj.replace(/\D/g, "") === cnpj,
      )
    ) {
      setFormError("Este CNPJ já está cadastrado.");
      return;
    }
    setSubmitting(true);
    try {
      await save("conveniados", editing?.id, {
        ...form,
        usuario_id: Number(form.usuario_id),
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social.trim(),
        categoria: form.categoria.trim(),
        cnpj,
        endereco: form.endereco.trim(),
      });
      notify(editing ? "Conveniado atualizado." : "Conveniado cadastrado.");
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o conveniado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function inactivate() {
    if (!inactivating) return;
    setSubmitting(true);
    try {
      await save("conveniados", inactivating.id, { status: "INATIVO" });
      notify("Conveniado inativado. O histórico foi preservado.");
      setInactivating(undefined);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Não foi possível inativar.",
        "error",
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
    category,
    setCategory,
    page,
    setPage,
    categories,

    // dados derivados
    filtered,
    currentPage,
    visibleRows,
    availableUsers,
    activeOfferCount,

    // formulário
    formOpen,
    setFormOpen,
    editing,
    form,
    setForm,
    formError,
    submitting,
    openForm,
    submit,

    // detalhes
    details,
    setDetails,

    // inativação
    inactivating,
    setInactivating,
    inactivate,

    // helpers
    conveniadoDaUtilizacao,
  };
}
