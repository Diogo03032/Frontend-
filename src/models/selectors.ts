import type { PortalData, Utilizacao } from "./types";
export const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
export function formatDate(value?: string | null, time = false) {
  if (!value) return "Não informado";
  const date = new Date(
    value.length === 10 ? `${value}T12:00:00` : value.replace(" ", "T"),
  );
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return (
    date.toLocaleDateString("pt-BR") +
    (time
      ? ` · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      : "")
  );
}
export const formatCnpj = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const labels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  AFASTADO: "Afastado",
  EM_ANALISE: "Em análise",
  DESCONTINUADO: "Descontinuado",
  PLANEJADA: "Planejada",
  ATIVA: "Ativa",
  ENCERRADA: "Encerrada",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  ESTORNADA: "Estornada",
  FCV: "Fundação",
  COLABORADOR: "Colaborador",
  CONVENIADO: "Conveniado",
  CAMPANHA: "Campanha",
  EVENTO_INTERNO: "Evento interno",
  EVENTO_PATROCINADO: "Evento patrocinado",
  VOUCHER: "Voucher",
  CORTESIA: "Cortesia",
};
export const statusLabel = (status: string) => labels[status] ?? status;
export const colaboradorNome = (data: PortalData, id: number) =>
  data.usuarios.find(
    (u) => u.id === data.colaboradores.find((c) => c.id === id)?.usuario_id,
  )?.nome ?? `Colaborador #${id}`;
export const conveniadoNome = (data: PortalData, id: number) =>
  data.conveniados.find((c) => c.id === id)?.nome_fantasia ??
  `Conveniado #${id}`;
export function beneficioDaUtilizacao(data: PortalData, uso: Utilizacao) {
  if (uso.beneficio_conveniado_id) {
    const oferta = data.ofertas.find(
      (o) => o.id === uso.beneficio_conveniado_id,
    );
    return data.beneficios.find((b) => b.id === oferta?.beneficio_id);
  }
  const oferta = data.ofertasCampanha.find(
    (o) => o.id === uso.beneficio_campanha_conveniado_id,
  );
  return data.itensCampanha.find((b) => b.id === oferta?.beneficio_campanha_id);
}
export function conveniadoDaUtilizacao(data: PortalData, uso: Utilizacao) {
  const oferta = uso.beneficio_conveniado_id
    ? data.ofertas.find((o) => o.id === uso.beneficio_conveniado_id)
    : data.ofertasCampanha.find(
        (o) => o.id === uso.beneficio_campanha_conveniado_id,
      );
  return data.conveniados.find((c) => c.id === oferta?.conveniado_id);
}
export function isAdministrador(
  user: { perfil?: string; perfil_id?: number },
  data?: PortalData,
) {
  return (
    (user.perfil ?? data?.perfis.find((p) => p.id === user.perfil_id)?.nome) ===
    "FCV_ADMINISTRADOR"
  );
}
export function canEstornar(uso: Utilizacao) {
  return uso.status === "APROVADA";
}
export function withinPeriod(value: string, days: number, now = new Date()) {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime()) || date > now) return false;
  if (days === 0) return true;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return date >= start && date <= now;
}
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
