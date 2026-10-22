import type { Beneficio, Conveniado, ItemCampanha, PortalData, Utilizacao } from "./types";

// Re-exportações para total compatibilidade retroativa
export * from "./formatters";
export * from "./rules";

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
 * Retorna o nome fantasia (ou fallback para ID) de um conveniado.
 */
export function conveniadoNome(data: PortalData, conveniadoId: number): string {
  const conveniado = data.conveniados.find((c) => c.id === conveniadoId);
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
