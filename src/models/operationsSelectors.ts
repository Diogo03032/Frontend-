import type { Campanha, PortalData } from "./types";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
} from "./selectors";

/** API campaign dates represent calendar days, so never convert them through UTC. */
export function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function calendarDateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftCalendarMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1, 12);
}

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
}

/** Whole weeks, Sunday first, with the actual four/five/six rows a month needs. */
export function calendarMonthDays(month: Date): CalendarDay[] {
  const first = shiftCalendarMonth(month, 0);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + index, 12);
    return { date: calendarDateKey(date), day: date.getDate(), inMonth: date.getMonth() === first.getMonth() };
  });
}

export function campaignsForDay(campaigns: Campanha[], day: string): Campanha[] {
  if (!parseCalendarDate(day)) return [];
  return campaigns
    .filter((item) => {
      const start = parseCalendarDate(item.data_inicio);
      const end = parseCalendarDate(item.data_fim);
      return start && end && calendarDateKey(start) <= day && calendarDateKey(end) >= day;
    })
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio) || a.nome.localeCompare(b.nome, "pt-BR") || a.id - b.id);
}

export function campaignsInMonth(campaigns: Campanha[], month: Date): Campanha[] {
  const first = calendarDateKey(shiftCalendarMonth(month, 0));
  const last = calendarDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12));
  return campaigns.filter((item) => {
    const start = parseCalendarDate(item.data_inicio);
    const end = parseCalendarDate(item.data_fim);
    return start && end && start <= end && calendarDateKey(start) <= last && calendarDateKey(end) >= first;
  });
}

export function filterCalendarCampaigns(campaigns: Campanha[], tipo = "", status = ""): Campanha[] {
  return campaigns.filter((item) => (!tipo || item.tipo === tipo) && (!status || item.status === status));
}

export type PendingKind = "CONVENIADO" | "UTILIZACAO";
export interface PendingOperation {
  key: string;
  id: number;
  kind: PendingKind;
  title: string;
  subtitle: string;
  detail: string;
  status: "EM_ANALISE" | "PENDENTE";
  href: string;
  date: string | null;
}

/** Only persisted states that actually mean pending work, never inactive employees. */
export function pendingOperations(data: PortalData): PendingOperation[] {
  const partners: PendingOperation[] = data.conveniados
    .filter((item) => item.status === "EM_ANALISE")
    .map((item) => ({
      key: `conveniado:${item.id}`,
      id: item.id,
      kind: "CONVENIADO",
      title: item.nome_fantasia || item.razao_social,
      subtitle: item.razao_social,
      detail: item.categoria || "Categoria não informada",
      status: "EM_ANALISE",
      href: `/conveniados/${item.id}`,
      date: null,
    }));
  const uses: PendingOperation[] = data.utilizacoes
    .filter((item) => item.status === "PENDENTE")
    .map((item) => {
      const partner = conveniadoDaUtilizacao(data, item);
      return {
        key: `utilizacao:${item.id}`,
        id: item.id,
        kind: "UTILIZACAO",
        title: colaboradorNome(data, item.colaborador_id),
        subtitle: beneficioDaUtilizacao(data, item)?.nome ?? "Benefício não encontrado",
        detail: partner?.nome_fantasia || partner?.razao_social || "Conveniado não encontrado",
        status: "PENDENTE",
        href: `/utilizacoes?utilizacao=${item.id}&status=PENDENTE`,
        date: item.data_solicitacao,
      };
    });
  return [...partners.sort((a, b) => a.title.localeCompare(b.title, "pt-BR") || a.id - b.id),
    ...uses.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id - b.id)];
}

const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export function filterPendingOperations(rows: PendingOperation[], search = "", kind = ""): PendingOperation[] {
  const query = normalizeSearch(search);
  return rows.filter((item) => (!kind || item.kind === kind) && normalizeSearch(`${item.id} ${item.title} ${item.subtitle} ${item.detail}`).includes(query));
}
