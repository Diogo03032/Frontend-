import assert from "node:assert/strict";
import test from "node:test";
import { filterUsageHistory, parseEntityId, usageMonthSeries } from "../src/models/detailSelectors";
import type { Utilizacao } from "../src/models/types";

const usage = (id: number, date: string, status: Utilizacao["status"] = "APROVADA"): Utilizacao => ({
  id, data_solicitacao: date, status, colaborador_id: 1, token_qrcode: `test-${id}`, valor_aplicado: 25,
});
test("identificadores de detalhe rejeitam frações, zero, notação exponencial e números inseguros", () => {
  assert.equal(parseEntityId("24"), 24);
  for (const value of [undefined, "", "0", "-1", "1.5", "1e2", " 2", "01", "9007199254740992"])
    assert.equal(parseEntityId(value), null, String(value));
});
test("gráfico atravessa a virada do ano, inclui meses vazios e conta apenas aprovadas até hoje", () => {
  const result = usageMonthSeries([
    usage(1, "2025-08-31 23:59:59"), usage(2, "2025-09-01 00:00:00"),
    usage(3, "2026-01-31 23:59:59"), usage(4, "2026-02-01 00:00:00"),
    usage(5, "2026-02-14 09:00:00", "ESTORNADA"), usage(6, "2026-02-14 09:00:00", "PENDENTE"),
    usage(7, "2026-02-16 00:00:00"), usage(8, "invalid"),
  ], new Date(2026, 1, 15, 12));
  assert.deepEqual(result.map(item => [item.key, item.count]), [
    ["2025-09", 1], ["2025-10", 0], ["2025-11", 0], ["2025-12", 0], ["2026-01", 1], ["2026-02", 1],
  ]);
});
test("histórico combina busca sem acentos, status, ordenação e referência de utilização", () => {
  const usages = [usage(1, "2026-10-20"), usage(2, "2026-10-20"), usage(3, "2026-10-19", "PENDENTE")];
  assert.deepEqual(filterUsageHistory(usages, "farmacia", "APROVADA", () => "Farmácia Saúde").map(item => item.id), [2, 1]);
  assert.deepEqual(filterUsageHistory(usages, "#00003", "PENDENTE", () => "").map(item => item.id), [3]);
  assert.equal(filterUsageHistory(usages, "ausente", "", () => "").length, 0);
  assert.deepEqual(usages.map(item => item.id), [1, 2, 3]);
});
