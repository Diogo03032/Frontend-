import type { PortalData, ReportResult, Utilizacao } from "./types";
import { beneficioDaUtilizacao, conveniadoDaUtilizacao } from "./selectors";

/**
 * Gera a chave única que identifica o benefício ou item de campanha de uma utilização.
 */
export function usoKey(data: PortalData, uso: Utilizacao): string {
  const item = beneficioDaUtilizacao(data, uso);
  return `${uso.beneficio_conveniado_id ? "beneficio" : "campanha"}:${item?.id ?? "desconhecido"}`;
}

/**
 * Constrói o relatório agregado de utilização para um intervalo de datas.
 * Executa agrupamentos otimizados em complexidade linear O(N) utilizando Map/Set.
 */
export function buildReport(data: PortalData, inicio: string, fim: string): ReportResult {
  const valid = Boolean(inicio && fim && fim >= inicio);

  const filtered = valid
    ? data.utilizacoes.filter((uso) => {
        const dia = uso.data_solicitacao.slice(0, 10);
        return dia >= inicio && dia <= fim;
      })
    : [];

  const approved = filtered.filter((uso) => uso.status === "APROVADA");

  const totalValor = approved.reduce(
    (total, uso) => total + Number(uso.valor_aplicado),
    0,
  );

  const participantes = new Set(approved.map((uso) => uso.colaborador_id)).size;

  const ativosIds = new Set(
    data.colaboradores
      .filter((item) => item.status === "ATIVO")
      .map((item) => item.id),
  );

  const ativosParticipantes = new Set(
    approved
      .filter((uso) => ativosIds.has(uso.colaborador_id))
      .map((uso) => uso.colaborador_id),
  ).size;

  const duration = valid
    ? Math.round(
        (Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) /
          86400000,
      ) + 1
    : 0;

  const previousEnd = valid
    ? new Date(Date.parse(`${inicio}T00:00:00Z`) - 86400000)
        .toISOString()
        .slice(0, 10)
    : "";

  const previousStart = valid
    ? new Date(Date.parse(`${inicio}T00:00:00Z`) - duration * 86400000)
        .toISOString()
        .slice(0, 10)
    : "";

  const previous = valid
    ? data.utilizacoes.filter(
        (uso) =>
          uso.status === "APROVADA" &&
          uso.data_solicitacao.slice(0, 10) >= previousStart &&
          uso.data_solicitacao.slice(0, 10) <= previousEnd,
      )
    : [];

  // Pré-agrupamento de utilizações aprovadas por chave de benefício e por conveniado (O(N))
  const usosPorBeneficioKey = new Map<string, Utilizacao[]>();
  const usosPorConveniadoId = new Map<number, Utilizacao[]>();
  const categoriaContagem: Record<string, number> = {};

  for (const uso of approved) {
    const key = usoKey(data, uso);
    const listaBeneficio = usosPorBeneficioKey.get(key);
    if (listaBeneficio) {
      listaBeneficio.push(uso);
    } else {
      usosPorBeneficioKey.set(key, [uso]);
    }

    const parceiro = conveniadoDaUtilizacao(data, uso);
    if (parceiro) {
      const listaConveniado = usosPorConveniadoId.get(parceiro.id);
      if (listaConveniado) {
        listaConveniado.push(uso);
      } else {
        usosPorConveniadoId.set(parceiro.id, [uso]);
      }
      const categoria = parceiro.categoria || "Sem categoria";
      categoriaContagem[categoria] = (categoriaContagem[categoria] ?? 0) + 1;
    } else {
      categoriaContagem["Sem categoria"] = (categoriaContagem["Sem categoria"] ?? 0) + 1;
    }
  }

  // Catálogo completo de benefícios regulares + itens de campanha
  const catalogo = [
    ...data.beneficios.map((item) => ({
      key: `beneficio:${item.id}`,
      nome: item.nome,
      origem: "Benefício regular",
      status: item.status,
    })),
    ...data.itensCampanha.map((item) => ({
      key: `campanha:${item.id}`,
      nome: item.nome,
      origem: "Item promocional",
      status: item.status,
    })),
  ];

  const benefits = catalogo
    .map((item) => {
      const usos = usosPorBeneficioKey.get(item.key) ?? [];
      const ativosComUso = new Set(
        usos
          .filter((uso) => ativosIds.has(uso.colaborador_id))
          .map((uso) => uso.colaborador_id),
      ).size;
      return {
        ...item,
        count: usos.length,
        participantes: new Set(usos.map((uso) => uso.colaborador_id)).size,
        valor: usos.reduce(
          (total, uso) => total + Number(uso.valor_aplicado),
          0,
        ),
        taxa: ativosIds.size ? (ativosComUso / ativosIds.size) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR"));

  const partners = data.conveniados
    .map((item) => {
      const usos = usosPorConveniadoId.get(item.id) ?? [];
      return {
        id: item.id,
        nome: item.nome_fantasia,
        categoria: item.categoria,
        count: usos.length,
        participantes: new Set(usos.map((uso) => uso.colaborador_id)).size,
        valor: usos.reduce(
          (total, uso) => total + Number(uso.valor_aplicado),
          0,
        ),
      };
    })
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR"));

  const categories = Object.entries(categoriaContagem)
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count);

  const periods = Object.entries(
    filtered.reduce<Record<string, Utilizacao[]>>((all, uso) => {
      const key = uso.data_solicitacao.slice(0, 7);
      (all[key] ??= []).push(uso);
      return all;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, usos]) => {
      const aprovadas = usos.filter((uso) => uso.status === "APROVADA");
      return {
        key,
        nome: new Date(`${key}-15T12:00:00`).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
        count: aprovadas.length,
        registros: usos.length,
        participantes: new Set(aprovadas.map((uso) => uso.colaborador_id)).size,
        valor: aprovadas.reduce(
          (total, uso) => total + Number(uso.valor_aplicado),
          0,
        ),
      };
    });

  // Otimização do cálculo de campanhas
  const itemCampanhaMap = new Map<number, number>();
  for (const item of data.itensCampanha) {
    itemCampanhaMap.set(item.id, item.campanha_id);
  }

  const ofertasCampanhaMap = new Map<number, number>();
  for (const oferta of data.ofertasCampanha) {
    const campanhaId = itemCampanhaMap.get(oferta.beneficio_campanha_id);
    if (campanhaId !== undefined) {
      ofertasCampanhaMap.set(oferta.id, campanhaId);
    }
  }

  const campaigns = data.campanhas
    .filter(
      (campanha) =>
        valid &&
        campanha.data_fim.slice(0, 10) >= inicio &&
        campanha.data_inicio.slice(0, 10) <= fim,
    )
    .map((campanha) => {
      const usos = approved.filter(
        (uso) =>
          uso.beneficio_campanha_conveniado_id &&
          ofertasCampanhaMap.get(uso.beneficio_campanha_conveniado_id) === campanha.id,
      );
      const participantesAtivos = new Set(
        usos
          .filter((uso) => ativosIds.has(uso.colaborador_id))
          .map((uso) => uso.colaborador_id),
      ).size;
      return {
        id: campanha.id,
        nome: campanha.nome,
        count: usos.length,
        participantes: new Set(usos.map((uso) => uso.colaborador_id)).size,
        taxa: ativosIds.size ? (participantesAtivos / ativosIds.size) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    valid,
    filtered,
    approved,
    totalValor,
    participantes,
    ativos: ativosIds.size,
    ativosParticipantes,
    taxaAdesao: ativosIds.size
      ? (ativosParticipantes / ativosIds.size) * 100
      : 0,
    custoMedio: participantes ? totalValor / participantes : 0,
    previous,
    previousStart,
    previousEnd,
    benefits,
    partners,
    categories,
    periods,
    campaigns,
  };
}
