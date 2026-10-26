import { useMemo, useState, type FormEvent } from "react";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import type { Colaborador } from "../models/types";
import { usePagination } from "../hooks/usePagination";

const PAGE_SIZE = 8;

export type ColaboradorForm = {
  usuario_id: string;
  matricula: string;
  setor: string;
  cargo: string;
  data_admissao: string;
  telefone: string;
  status: Colaborador["status"];
};

const blankForm = (): ColaboradorForm => ({
  usuario_id: "",
  matricula: "",
  setor: "",
  cargo: "",
  data_admissao: "",
  telefone: "",
  status: "ATIVO",
});

export function useColaboradoresVM() {
  const { data, save, loading } = usePortal();
  const { notify } = useToast();

  // ── Filtros ──
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("buscar") ?? "",
  );
  const [status, setStatus] = useState("");
  const [setor, setSetor] = useState("");

  // ── Modais / formulário ──
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador>();
  const [details, setDetails] = useState<Colaborador>();
  const [inactivating, setInactivating] = useState<Colaborador>();
  const [form, setForm] = useState<ColaboradorForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Dados derivados memoizados ──
  const sectors = useMemo(
    () =>
      [...new Set(data.colaboradores.map((item) => item.setor).filter(Boolean))].sort(),
    [data.colaboradores],
  );

  const availableUsers = useMemo(
    () =>
      data.usuarios.filter(
        (user) =>
          (user.id === editing?.usuario_id ||
            data.perfis.find((profile) => profile.id === user.perfil_id)?.escopo ===
              "COLABORADOR") &&
          !data.colaboradores.some(
            (item) => item.usuario_id === user.id && item.id !== editing?.id,
          ),
      ),
    [data.usuarios, data.perfis, data.colaboradores, editing?.id, editing?.usuario_id],
  );

  const usuariosMap = useMemo(
    () => new Map(data.usuarios.map((u) => [u.id, u])),
    [data.usuarios],
  );

  const filtered = useMemo(
    () =>
      data.colaboradores.filter((item) => {
        const user = usuariosMap.get(item.usuario_id);
        const nome = user?.nome ?? `Colaborador #${item.id}`;
        const text =
          `${nome} ${user?.email ?? ""} ${item.matricula} ${item.setor} ${item.cargo}`.toLocaleLowerCase(
            "pt-BR",
          );
        return (
          (!status || item.status === status) &&
          (!setor || item.setor === setor) &&
          text.includes(search.trim().toLocaleLowerCase("pt-BR"))
        );
      }),
    [data.colaboradores, usuariosMap, status, setor, search],
  );

  const {
    page: currentPage,
    setPage,
    start,
    end,
  } = usePagination(filtered.length, PAGE_SIZE);

  const visibleRows = useMemo(
    () => filtered.slice(start, end),
    [filtered, start, end],
  );

  // ── Ações ──
  function openForm(item?: Colaborador) {
    setEditing(item);
    setForm(
      item
        ? {
            usuario_id: String(item.usuario_id),
            matricula: item.matricula,
            setor: item.setor,
            cargo: item.cargo,
            data_admissao: item.data_admissao.slice(0, 10),
            telefone: item.telefone ?? "",
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
    if (!form.usuario_id) {
      setFormError("Selecione um usuário para vincular ao colaborador.");
      return;
    }
    if (
      [form.matricula, form.setor, form.cargo].some((value) => !value.trim())
    ) {
      setFormError("Preencha os campos obrigatórios com dados válidos.");
      return;
    }
    if (
      data.colaboradores.some(
        (item) =>
          item.id !== editing?.id &&
          item.matricula.toLocaleLowerCase("pt-BR") ===
            form.matricula.trim().toLocaleLowerCase("pt-BR"),
      )
    ) {
      setFormError("Esta matrícula já está cadastrada.");
      return;
    }
    setSubmitting(true);
    try {
      await save("colaboradores", editing?.id, {
        ...form,
        usuario_id: Number(form.usuario_id),
        matricula: form.matricula.trim(),
        setor: form.setor.trim(),
        cargo: form.cargo.trim(),
        telefone: form.telefone.trim() || null,
      });
      notify(editing ? "Colaborador atualizado." : "Colaborador cadastrado.");
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o colaborador.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function inactivate() {
    if (!inactivating) return;
    setSubmitting(true);
    try {
      await save("colaboradores", inactivating.id, { status: "INATIVO" });
      notify("Colaborador inativado. O histórico foi preservado.");
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
    setor,
    setSetor,
    page: currentPage,
    setPage,
    sectors,

    // dados derivados
    filtered,
    currentPage,
    visibleRows,
    availableUsers,

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
  };
}
