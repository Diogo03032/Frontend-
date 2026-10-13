import type { PortalData, Utilizacao } from "./types";
import { beneficioDaUtilizacao, conveniadoDaUtilizacao } from "./selectors";

function usoKey(data: PortalData, uso: Utilizacao) {
  const item = beneficioDaUtilizacao(data, uso);
  return `${uso.beneficio_conveniado_id ? "beneficio" : "campanha"}:${item?.id ?? "desconhecido"}`;
}

export function buildReport(data: PortalData, inicio: string, fim: string) {
  const valid = !!inicio && !!fim && fim >= inicio;
  const filtered = valid
    ? data.utilizacoes.filter(
        (uso) =>
          uso.data_solicitacao.slice(0, 10) >= inicio &&
          uso.data_solicitacao.slice(0, 10) <= fim,
      )
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
      const usos = approved.filter((uso) => usoKey(data, uso) === item.key);
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
      const usos = approved.filter(
        (uso) => conveniadoDaUtilizacao(data, uso)?.id === item.id,
      );
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
  const categories = Object.entries(
    approved.reduce<Record<string, number>>((all, uso) => {
      const categoria =
        conveniadoDaUtilizacao(data, uso)?.categoria || "Sem categoria";
      all[categoria] = (all[categoria] ?? 0) + 1;
      return all;
    }, {}),
  )
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
  const campaigns = data.campanhas
    .filter(
      (campanha) =>
        valid &&
        campanha.data_fim.slice(0, 10) >= inicio &&
        campanha.data_inicio.slice(0, 10) <= fim,
    )
    .map((campanha) => {
      const ofertasIds = new Set(
        data.ofertasCampanha
          .filter((oferta) =>
            data.itensCampanha.some(
              (item) =>
                item.id === oferta.beneficio_campanha_id &&
                item.campanha_id === campanha.id,
            ),
          )
          .map((oferta) => oferta.id),
      );
      const usos = approved.filter(
        (uso) =>
          uso.beneficio_campanha_conveniado_id &&
          ofertasIds.has(uso.beneficio_campanha_conveniado_id),
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
