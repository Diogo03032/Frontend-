import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
} from "../models/selectors";

type Utilizacao = ReturnType<typeof usePortal>["data"]["utilizacoes"][number];
const PAGE_SIZE = 8;

export function useUtilizacoesVM() {
  const { data, save } = usePortal();
  const { notify } = useToast();
  const navigate = useNavigate();

  // ── Filtros ──
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get("buscar") ?? "",
  );
  const [status, setStatus] = useState(
    () => new URLSearchParams(window.location.search).get("status") ?? "",
  );
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [conveniado, setConveniado] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [page, setPage] = useState(1);

  // ── Modais ──
  const [selected, setSelected] = useState<Utilizacao | null>(() => {
    const id = Number(
      new URLSearchParams(window.location.search).get("utilizacao"),
    );
    return data.utilizacoes.find((item) => item.id === id) ?? null;
  });
  const [reversal, setReversal] = useState<Utilizacao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const periodoInvalido = !!inicio && !!fim && fim < inicio;

  function closeDetails() {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("utilizacao")) {
      params.delete("utilizacao");
      navigate(
        { pathname: "/utilizacoes", search: params.toString() },
        { replace: true },
      );
    }
  }

  // ── Dados derivados ──
  const rows = useMemo(
    () =>
      data.utilizacoes.filter((uso) => {
        const item = beneficioDaUtilizacao(data, uso);
        const parceiro = conveniadoDaUtilizacao(data, uso);
        const dia = uso.data_solicitacao.slice(0, 10);
        const texto =
          `${uso.id} ${colaboradorNome(data, uso.colaborador_id)} ${item?.nome ?? ""} ${parceiro?.nome_fantasia ?? ""} ${parceiro?.razao_social ?? ""}`.toLocaleLowerCase(
            "pt-BR",
          );
        return (
          !periodoInvalido &&
          texto.includes(search.toLocaleLowerCase("pt-BR")) &&
          (!status || uso.status === status) &&
          (!inicio || dia >= inicio) &&
          (!fim || dia <= fim) &&
          (!colaborador || uso.colaborador_id === Number(colaborador)) &&
          (!conveniado || parceiro?.id === Number(conveniado)) &&
          (!beneficio ||
            `${uso.beneficio_conveniado_id ? "beneficio" : "campanha"}:${item?.id}` ===
              beneficio)
        );
      }),
    [
      data,
      search,
      status,
      inicio,
      fim,
      colaborador,
      conveniado,
      beneficio,
      periodoInvalido,
    ],
  );

  const aprovadas = rows.filter((uso) => uso.status === "APROVADA");
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = [...rows]
    .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao))
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  // ── Ações ──
  async function estornar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reversal || !motivo.trim() || saving) return;
    const atual = data.utilizacoes.find((uso) => uso.id === reversal.id);
    if (atual?.status !== "APROVADA") {
      notify("Somente utilizações aprovadas podem ser estornadas.", "error");
      setReversal(null);
      return;
    }
    setSaving(true);
    try {
      await save("utilizacoes", reversal.id, {
        status: "ESTORNADA",
        observacoes: [
          reversal.observacoes,
          `Motivo do estorno: ${motivo.trim()}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      notify(
        "Utilização estornada. O registro permanece no histórico.",
        "success",
      );
      setReversal(null);
      setSelected(null);
      setMotivo("");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível estornar a utilização.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function limparFiltros() {
    setSearch("");
    setStatus("");
    setInicio("");
    setFim("");
    setColaborador("");
    setConveniado("");
    setBeneficio("");
    setPage(1);
  }

  return {
    // contexto
    data,
    PAGE_SIZE,

    // filtros
    search,
    setSearch,
    status,
    setStatus,
    inicio,
    setInicio,
    fim,
    setFim,
    colaborador,
    setColaborador,
    conveniado,
    setConveniado,
    beneficio,
    setBeneficio,
    page,
    setPage,
    periodoInvalido,
    filter,
    limparFiltros,

    // dados derivados
    rows,
    aprovadas,
    currentPage,
    visibleRows,

    // detalhes
    selected,
    setSelected,
    closeDetails,

    // estorno
    reversal,
    setReversal,
    motivo,
    setMotivo,
    saving,
    estornar,
  };
}
