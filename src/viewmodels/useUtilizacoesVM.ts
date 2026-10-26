import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePortal } from "./PortalContext";
import { useToast } from "./ToastContext";
import { usePagination } from "../hooks/usePagination";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  createDataIndexes,
  colaboradorNomeIndexed,
  beneficioDaUtilizacaoIndexed,
  conveniadoDaUtilizacaoIndexed,
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

  // ── Índices e dados derivados memoizados em O(N) ──
  const indexes = useMemo(() => createDataIndexes(data), [data]);

  const enrichedRows = useMemo(() => {
    return data.utilizacoes.map((uso) => {
      const item = beneficioDaUtilizacaoIndexed(indexes, uso);
      const parceiro = conveniadoDaUtilizacaoIndexed(indexes, uso);
      const colabNome = colaboradorNomeIndexed(indexes, uso.colaborador_id);
      const dia = uso.data_solicitacao.slice(0, 10);
      const texto =
        `${uso.id} ${colabNome} ${item?.nome ?? ""} ${parceiro?.nome_fantasia ?? ""} ${parceiro?.razao_social ?? ""}`.toLocaleLowerCase(
          "pt-BR",
        );
      const beneficioKey = `${uso.beneficio_conveniado_id ? "beneficio" : "campanha"}:${item?.id}`;
      return {
        ...uso,
        colaboradorNome: colabNome,
        beneficioItem: item,
        conveniadoItem: parceiro,
        conveniadoId: parceiro?.id,
        dia,
        searchTarget: texto,
        beneficioKey,
      };
    });
  }, [data, indexes]);

  const rows = useMemo(() => {
    if (periodoInvalido) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const colabNum = colaborador ? Number(colaborador) : null;
    const convNum = conveniado ? Number(conveniado) : null;

    return enrichedRows.filter((uso) => {
      return (
        (!term || uso.searchTarget.includes(term)) &&
        (!status || uso.status === status) &&
        (!inicio || uso.dia >= inicio) &&
        (!fim || uso.dia <= fim) &&
        (!colabNum || uso.colaborador_id === colabNum) &&
        (!convNum || uso.conveniadoId === convNum) &&
        (!beneficio || uso.beneficioKey === beneficio)
      );
    });
  }, [
    enrichedRows,
    search,
    status,
    inicio,
    fim,
    colaborador,
    conveniado,
    beneficio,
    periodoInvalido,
  ]);

    const aprovadas = rows.filter((uso) => uso.status === "APROVADA");
    const {
    page: currentPage,
    setPage,
    start,
    end,
  } = usePagination(rows.length, PAGE_SIZE);

  const visibleRows = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao))
        .slice(start, end),
    [rows, start, end],
  );

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
    page: currentPage,
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
