import type {
  Beneficio,
  Colaborador,
  Conveniado,
  ItemCampanha,
  Oferta,
  OfertaCampanha,
  PortalData,
  Usuario,
  Utilizacao,
} from "./types";

// Re-exportações para total compatibilidade retroativa
export * from "./formatters";
export * from "./rules";

/**
 * Estrutura de índices Map para resolução relacional em complexidade O(1).
 */
export interface DataIndexes {
  usuarios: Map<number, Usuario>;
  colaboradores: Map<number, Colaborador>;
  conveniados: Map<number, Conveniado>;
  beneficios: Map<number, Beneficio>;
  itensCampanha: Map<number, ItemCampanha>;
  ofertas: Map<number, Oferta>;
  ofertasCampanha: Map<number, OfertaCampanha>;
}

/**
 * Constrói índices Map em O(N) para todas as entidades relacionais do portal.
 */
export function createDataIndexes(data: PortalData): DataIndexes {
  return {
    usuarios: new Map(data.usuarios.map((u) => [u.id, u])),
    colaboradores: new Map(data.colaboradores.map((c) => [c.id, c])),
    conveniados: new Map(data.conveniados.map((c) => [c.id, c])),
    beneficios: new Map(data.beneficios.map((b) => [b.id, b])),
    itensCampanha: new Map(data.itensCampanha.map((i) => [i.id, i])),
    ofertas: new Map(data.ofertas.map((o) => [o.id, o])),
    ofertasCampanha: new Map(data.ofertasCampanha.map((o) => [o.id, o])),
  };
}

/**
 * Retorna o nome do colaborador a partir do seu ID de entidade.
 * Realiza a resolução de relacionamento: Colaborador -> Usuario -> nome.
 */
export function colaboradorNome(data: PortalData, colaboradorId: number): string {
  const colaborador = data.colaboradores.find((c) => c.id === colaboradorId);
  if (!colaborador) return `Colaborador #${colaboradorId}`;
  const usuario = data.usuarios.find((u) => u.id === colaborador.usuario_id);
  return usuario?.nome ?? `Colaborador #${colaboradorId}`;
}

/**
 * Versão O(1) de colaboradorNome utilizando índices pré-computados.
 */
export function colaboradorNomeIndexed(
  indexes: DataIndexes,
  colaboradorId: number,
): string {
  const colaborador = indexes.colaboradores.get(colaboradorId);
  if (!colaborador) return `Colaborador #${colaboradorId}`;
  const usuario = indexes.usuarios.get(colaborador.usuario_id);
  return usuario?.nome ?? `Colaborador #${colaboradorId}`;
}

/**
 * Retorna o nome fantasia (ou fallback para ID) de um conveniado.
 */
export function conveniadoNome(data: PortalData, conveniadoId: number): string {
  const conveniado = data.conveniados.find((c) => c.id === conveniadoId);
  return conveniado?.nome_fantasia || conveniado?.razao_social || `Conveniado #${conveniadoId}`;
}

/**
 * Versão O(1) de conveniadoNome utilizando índices pré-computados.
 */
export function conveniadoNomeIndexed(
  indexes: DataIndexes,
  conveniadoId: number,
): string {
  const conveniado = indexes.conveniados.get(conveniadoId);
  return conveniado?.nome_fantasia || conveniado?.razao_social || `Conveniado #${conveniadoId}`;
}

/**
 * Obtém o item de benefício associado à utilização (seja benefício regular ou item de campanha).
 */
export function beneficioDaUtilizacao(
  data: PortalData,
  uso: Utilizacao,
): Beneficio | ItemCampanha | undefined {
  if (uso.beneficio_conveniado_id) {
    const oferta = data.ofertas.find((o) => o.id === uso.beneficio_conveniado_id);
    return oferta ? data.beneficios.find((b) => b.id === oferta.beneficio_id) : undefined;
  }
  if (uso.beneficio_campanha_conveniado_id) {
    const ofertaCampanha = data.ofertasCampanha.find(
      (o) => o.id === uso.beneficio_campanha_conveniado_id,
    );
    return ofertaCampanha
      ? data.itensCampanha.find((b) => b.id === ofertaCampanha.beneficio_campanha_id)
      : undefined;
  }
  return undefined;
}

/**
 * Versão O(1) de beneficioDaUtilizacao utilizando índices pré-computados.
 */
export function beneficioDaUtilizacaoIndexed(
  indexes: DataIndexes,
  uso: Utilizacao,
): Beneficio | ItemCampanha | undefined {
  if (uso.beneficio_conveniado_id) {
    const oferta = indexes.ofertas.get(uso.beneficio_conveniado_id);
    return oferta ? indexes.beneficios.get(oferta.beneficio_id) : undefined;
  }
  if (uso.beneficio_campanha_conveniado_id) {
    const ofertaCampanha = indexes.ofertasCampanha.get(
      uso.beneficio_campanha_conveniado_id,
    );
    return ofertaCampanha
      ? indexes.itensCampanha.get(ofertaCampanha.beneficio_campanha_id)
      : undefined;
  }
  return undefined;
}

/**
 * Obtém o conveniado associado à utilização, via oferta regular ou oferta de campanha.
 */
export function conveniadoDaUtilizacao(
  data: PortalData,
  uso: Utilizacao,
): Conveniado | undefined {
  if (uso.beneficio_conveniado_id) {
    const oferta = data.ofertas.find((o) => o.id === uso.beneficio_conveniado_id);
    return oferta ? data.conveniados.find((c) => c.id === oferta.conveniado_id) : undefined;
  }
  if (uso.beneficio_campanha_conveniado_id) {
    const ofertaCampanha = data.ofertasCampanha.find(
      (o) => o.id === uso.beneficio_campanha_conveniado_id,
    );
    return ofertaCampanha
      ? data.conveniados.find((c) => c.id === ofertaCampanha.conveniado_id)
      : undefined;
  }
  return undefined;
}

/**
 * Versão O(1) de conveniadoDaUtilizacao utilizando índices pré-computados.
 */
export function conveniadoDaUtilizacaoIndexed(
  indexes: DataIndexes,
  uso: Utilizacao,
): Conveniado | undefined {
  if (uso.beneficio_conveniado_id) {
    const oferta = indexes.ofertas.get(uso.beneficio_conveniado_id);
    return oferta ? indexes.conveniados.get(oferta.conveniado_id) : undefined;
  }
  if (uso.beneficio_campanha_conveniado_id) {
    const ofertaCampanha = indexes.ofertasCampanha.get(
      uso.beneficio_campanha_conveniado_id,
    );
    return ofertaCampanha
      ? indexes.conveniados.get(ofertaCampanha.conveniado_id)
      : undefined;
  }
  return undefined;
}

