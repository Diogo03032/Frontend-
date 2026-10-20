import assert from "node:assert/strict";
import test from "node:test";
import { createFixtureData } from "./fixtures/portalData";
import { calendarDateKey, calendarMonthDays, campaignsForDay, campaignsInMonth, filterCalendarCampaigns, filterPendingOperations, parseCalendarDate, pendingOperations, shiftCalendarMonth } from "../src/models/operationsSelectors";
import type { Campanha } from "../src/models/types";

function campaign(id: number, inicio: string, fim: string, status: Campanha["status"] = "ATIVA"): Campanha {
  return { id, nome: `Campanha ${id}`, tipo: "CAMPANHA", data_inicio: inicio, data_fim: fim, status };
}

test("calendário usa dias locais inclusive quando a API fornece timestamps UTC", () => {
  assert.equal(calendarDateKey(parseCalendarDate("2026-10-01T00:00:00.000Z")!), "2026-10-01");
  assert.equal(calendarDateKey(parseCalendarDate("2024-02-29")!), "2024-02-29");
  for (const invalid of ["2026-02-29", "2026-13-01", "2026-04-31", "01/10/2026", ""]) assert.equal(parseCalendarDate(invalid), null);
});

test("mês inclui semanas completas e avança entre dezembro e janeiro sem pular dias", () => {
  const october = calendarMonthDays(new Date(2026, 9, 20, 12));
  assert.equal(october.length, 35);
  assert.equal(october[0].date, "2026-09-27");
  assert.equal(october.at(-1)?.date, "2026-10-31");
  assert.equal(october.filter(day => day.inMonth).length, 31);
  const august = calendarMonthDays(new Date(2026, 7, 1, 12));
  assert.equal(august.length, 42);
  assert.equal(august.at(-1)?.date, "2026-09-05");
  const february = calendarMonthDays(new Date(2026, 1, 1, 12));
  assert.equal(february.length, 28);
  assert.equal(calendarMonthDays(new Date(2024, 1, 1, 12)).filter(day => day.inMonth).length, 29);
  assert.equal(calendarDateKey(shiftCalendarMonth(new Date(2026, 11, 31), 1)), "2027-01-01");
  assert.equal(calendarDateKey(shiftCalendarMonth(new Date(2026, 0, 31), -1)), "2025-12-01");
  assert.equal(new Set(august.map(day => day.date)).size, august.length);
});

test("campanhas de vários dias incluem início, fim e cruzamentos de mês", () => {
  const items = [campaign(1, "2026-09-30T00:00:00.000Z", "2026-10-02T00:00:00.000Z"), campaign(2, "2026-10-02", "2026-10-02"), campaign(3, "2026-10-31", "2026-11-02"), campaign(4, "2026-11-01", "2026-11-05"), campaign(5, "2026-10-15", "2026-10-10"), campaign(6, "inválida", "2026-10-31")];
  for (const day of ["2026-09-30", "2026-10-01", "2026-10-02"]) assert.ok(campaignsForDay(items, day).some(item => item.id === 1));
  assert.equal(campaignsForDay(items, "2026-10-03").length, 0);
  assert.deepEqual(campaignsForDay(items, "2026-10-02").map(item => item.id), [1, 2]);
  assert.deepEqual(campaignsInMonth(items, new Date(2026, 9, 1)).map(item => item.id), [1, 2, 3]);
  assert.equal(campaignsForDay(items, "inválida").length, 0);
});

test("filtros do calendário preservam os status reais e combinam tipo e status", () => {
  const items = [campaign(1, "2026-10-01", "2026-10-30"), { ...campaign(2, "2026-10-01", "2026-10-30", "PLANEJADA"), tipo: "EVENTO_INTERNO" as const }, campaign(3, "2026-10-01", "2026-10-30", "CANCELADA")];
  assert.equal(filterCalendarCampaigns(items).length, 3);
  assert.deepEqual(filterCalendarCampaigns(items, "EVENTO_INTERNO", "PLANEJADA").map(item => item.id), [2]);
  assert.equal(filterCalendarCampaigns(items, "EVENTO_INTERNO", "ATIVA").length, 0);
});

test("central agrega apenas conveniados em análise e utilizações pendentes sem colisão entre IDs", () => {
  const data = createFixtureData();
  data.conveniados = [{ ...data.conveniados[0], id: 1, status: "EM_ANALISE" }, { ...data.conveniados[1], id: 2, status: "ATIVO" }, { ...data.conveniados[1], id: 3, status: "INATIVO" }];
  data.utilizacoes = ["PENDENTE", "APROVADA", "REPROVADA", "ESTORNADA"].map((status, index) => ({ ...data.utilizacoes[0], id: index + 1, status: status as typeof data.utilizacoes[number]["status"] }));
  data.colaboradores = data.colaboradores.map(item => ({ ...item, status: "INATIVO" }));
  const rows = pendingOperations(data);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.key), ["conveniado:1", "utilizacao:1"]);
  assert.equal(rows[0].date, null);
  assert.equal(rows[0].href, "/conveniados/1");
  assert.equal(rows[1].href, "/utilizacoes?utilizacao=1&status=PENDENTE");
  assert.equal(rows[1].subtitle, "Alimentação");
  assert.equal(new Set(rows.map(row => row.key)).size, rows.length);
});

test("busca das pendências resolve relacionamentos, ignora acentos e combina tipo", () => {
  const data = createFixtureData();
  data.conveniados[0].status = "EM_ANALISE";
  data.utilizacoes = [{ ...data.utilizacoes[0], status: "PENDENTE" }];
  const rows = pendingOperations(data);
  assert.equal(filterPendingOperations(rows, "ALIMENTACAO", "UTILIZACAO").length, 1);
  assert.equal(filterPendingOperations(rows, "ana carolina", "UTILIZACAO").length, 1);
  assert.equal(filterPendingOperations(rows, "sabor", "UTILIZACAO").length, 1);
  assert.equal(filterPendingOperations(rows, "ana carolina", "CONVENIADO").length, 0);
  assert.equal(filterPendingOperations(rows, "inexistente").length, 0);
  assert.equal(filterPendingOperations([], "", "").length, 0);
});
