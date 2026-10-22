import type { PortalData, Utilizacao } from "./types";

export const PERFIL_ADMINISTRADOR = "FCV_ADMINISTRADOR";

/**
 * Verifica se o usuário autenticado possui perfil de Administrador FCV.
 */
export function isAdministrador(
  user: { perfil?: string; perfil_id?: number },
  data?: PortalData,
): boolean {
  const perfilNome =
    user.perfil ??
    (data && user.perfil_id !== undefined
      ? data.perfis.find((p) => p.id === user.perfil_id)?.nome
      : undefined);

  return perfilNome === PERFIL_ADMINISTRADOR;
}

/**
 * Determina se uma utilização é passível de estorno.
 * Apenas utilizações no estado 'APROVADA' podem ser estornadas.
 */
export function canEstornar(uso: Utilizacao): boolean {
  return uso.status === "APROVADA";
}

/**
 * Valida se uma solicitação de estorno atende aos requisitos de negócio.
 */
export function validateEstorno(
  uso: Utilizacao | undefined,
  update: { status?: string; observacoes?: string | null },
): { valid: boolean; error?: string } {
  if (!uso || !canEstornar(uso) || update.status !== "ESTORNADA" || !update.observacoes?.trim()) {
    return {
      valid: false,
      error: "Só é permitido estornar uma utilização aprovada, informando o motivo.",
    };
  }
  return { valid: true };
}

/**
 * Verifica se um registro temporal está contido dentro de um período em dias.
 * @param value Data em formato ISO ou SQL datetime
 * @param days Quantidade de dias retroativos (0 indica todo o período)
 * @param now Ponto de referência temporal
 */
export function withinPeriod(value: string, days: number, now = new Date()): boolean {
  const normalized = value.length === 10 ? `${value}T12:00:00` : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime()) || date > now) return false;
  if (days === 0) return true;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return date >= start && date <= now;
}
