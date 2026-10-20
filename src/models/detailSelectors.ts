import type { Utilizacao } from "./types";

export function parseEntityId(value?: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function usageMonthSeries(usages: Utilizacao[], now = new Date()) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      count: 0,
    };
  });
  for (const usage of usages) {
    if (usage.status !== "APROVADA") continue;
    const date = new Date(usage.data_solicitacao.length === 10
      ? `${usage.data_solicitacao}T12:00:00`
      : usage.data_solicitacao.replace(" ", "T"));
    if (Number.isNaN(date.getTime()) || date > now) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = months.find(item => item.key === key);
    if (month) month.count++;
  }
  return months;
}

export const normalizeSearch = (value: string) => value
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");

export function filterUsageHistory(
  usages: Utilizacao[],
  search: string,
  status: string,
  describe: (usage: Utilizacao) => string,
) {
  const term = normalizeSearch(search);
  return usages.filter(usage => (!status || usage.status === status)
    && normalizeSearch(`#${String(usage.id).padStart(5, "0")} ${usage.id} ${describe(usage)}`).includes(term))
    .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao) || b.id - a.id);
}
