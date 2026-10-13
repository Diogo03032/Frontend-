import assert from "node:assert/strict";
import test from "node:test";
import { createDemoData } from "../src/models/demoData";
import { buildReport } from "../src/models/reportSelectors";
import {
  beneficioDaUtilizacao,
  canEstornar,
  colaboradorNome,
  conveniadoDaUtilizacao,
  isAdministrador,
  statusLabel,
  withinPeriod,
} from "../src/models/selectors";
import type { PortalData, Utilizacao } from "../src/models/types";

function fixture(): PortalData {
  const data = createDemoData();
  data.campanhas = [
    { ...data.campanhas[0], data_inicio: "2026-10-01", data_fim: "2026-10-13" },
  ];
  const uso = (
    id: number,
    date: string,
    status: Utilizacao["status"],
    valor: number,
    colaborador = 1,
    campanha = false,
  ): Utilizacao => ({
    id,
    colaborador_id: colaborador,
    beneficio_conveniado_id: campanha ? null : 1,
    beneficio_campanha_conveniado_id: campanha ? 1 : null,
    token_qrcode: `fixture-${id}`,
    data_solicitacao: date,
    status,
    valor_aplicado: valor,
    observacoes: status === "ESTORNADA" ? "Solicitação duplicada" : null,
  });
  data.utilizacoes = [
    uso(1, "2026-10-01T00:00:00", "APROVADA", 12.5),
    uso(2, "2026-10-13T23:59:59", "APROVADA", 30, 2, true),
    uso(3, "2026-09-30T23:59:59", "APROVADA", 10, 3),
    uso(4, "2026-10-14T00:00:00", "APROVADA", 100, 4),
    uso(5, "2026-10-10T12:00:00", "PENDENTE", 999, 4),
    uso(6, "2026-10-08T12:00:00", "REPROVADA", 200, 5),
    uso(7, "2026-10-12T12:00:00", "ESTORNADA", 300, 6),
    uso(8, "2026-10-05T12:00:00", "APROVADA", 7.5),
  ];
  return data;
}

test("relatório inclui ambas as datas limite e exclui registros fora do período", () => {
  const report = buildReport(fixture(), "2026-10-01", "2026-10-13");
  assert.equal(report.valid, true);
  assert.deepEqual(
    report.filtered.map((uso) => uso.id),
    [1, 2, 5, 6, 7, 8],
  );
  assert.equal(report.previousStart, "2026-09-18");
  assert.equal(report.previousEnd, "2026-09-30");
  assert.deepEqual(
    report.previous.map((uso) => uso.id),
    [3],
  );
});

test("indicadores consideram apenas aprovações e contam pessoas sem duplicação", () => {
  const report = buildReport(fixture(), "2026-10-01", "2026-10-13");
  assert.deepEqual(
    report.approved.map((uso) => uso.id),
    [1, 2, 8],
  );
  assert.equal(report.totalValor, 50);
  assert.equal(report.participantes, 2);
  assert.equal(report.custoMedio, 25);
  assert.equal(report.ativosParticipantes, 2);
  assert.equal(report.taxaAdesao, 25);
  assert.equal(report.periods[0].registros, 6);
  assert.equal(report.periods[0].count, 3);
  assert.equal(report.periods[0].valor, 50);
});

test("joins separam benefício regular e item de campanha mesmo com IDs iguais", () => {
  const data = fixture();
  const regular = data.utilizacoes[0];
  const campanha = data.utilizacoes[1];
  assert.equal(beneficioDaUtilizacao(data, regular)?.nome, "Alimentação");
  assert.equal(
    beneficioDaUtilizacao(data, campanha)?.nome,
    "Check-up preventivo",
  );
  assert.equal(
    conveniadoDaUtilizacao(data, regular)?.nome_fantasia,
    "Sabor & Cia Restaurante",
  );
  assert.equal(
    conveniadoDaUtilizacao(data, campanha)?.nome_fantasia,
    "Farmácia Vida",
  );
  assert.equal(
    colaboradorNome(data, regular.colaborador_id),
    "Ana Carolina Silva",
  );
  const report = buildReport(data, "2026-10-01", "2026-10-13");
  assert.equal(
    report.benefits.find((item) => item.key === "beneficio:1")?.count,
    2,
  );
  assert.equal(
    report.benefits.find((item) => item.key === "campanha:1")?.count,
    1,
  );
  assert.equal(
    report.benefits.find((item) => item.key === "campanha:1")?.valor,
    30,
  );
  assert.equal(report.partners.find((item) => item.id === 1)?.count, 2);
  assert.equal(report.partners.find((item) => item.id === 2)?.count, 1);
  assert.equal(report.campaigns[0].count, 1);
  assert.equal(report.campaigns[0].participantes, 1);
  assert.equal(
    report.categories.find((item) => item.nome === "Alimentação")?.count,
    2,
  );
  assert.equal(
    report.categories.find((item) => item.nome === "Saúde")?.count,
    1,
  );
});

test("estorno retira valores e adesão dos indicadores sem apagar o histórico", () => {
  const data = fixture();
  data.utilizacoes[1] = {
    ...data.utilizacoes[1],
    status: "ESTORNADA",
    observacoes: "Motivo do estorno: duplicidade",
  };
  const report = buildReport(data, "2026-10-01", "2026-10-13");
  assert.equal(report.filtered.length, 6);
  assert.equal(report.totalValor, 20);
  assert.equal(report.participantes, 1);
  assert.equal(report.campaigns[0].count, 0);
  assert.equal(
    report.benefits.find((item) => item.key === "campanha:1")?.count,
    0,
  );
  assert.equal(data.utilizacoes.length, 8);
});

test("períodos vazios ou invertidos não geram valores inválidos ou omitem benefícios sem uso", () => {
  const data = fixture();
  for (const [inicio, fim] of [
    ["", "2026-10-13"],
    ["2026-10-14", "2026-10-13"],
    ["2026-01-01", "2026-01-10"],
  ]) {
    const report = buildReport(data, inicio, fim);
    assert.equal(report.approved.length, 0);
    assert.equal(report.totalValor, 0);
    assert.equal(report.custoMedio, 0);
    assert.equal(
      report.benefits.length,
      data.beneficios.length + data.itensCampanha.length,
    );
    assert.ok(
      report.benefits.every(
        (item) => item.count === 0 && Number.isFinite(item.taxa),
      ),
    );
  }
  data.colaboradores = [];
  data.utilizacoes = [];
  const empty = buildReport(data, "2026-10-01", "2026-10-13");
  assert.equal(empty.taxaAdesao, 0);
  assert.equal(empty.custoMedio, 0);
});

test("apenas APROVADA admite estorno; os estados mantêm rótulos distintos", () => {
  const uso = fixture().utilizacoes[0];
  assert.equal(canEstornar({ ...uso, status: "APROVADA" }), true);
  for (const status of ["PENDENTE", "REPROVADA", "ESTORNADA"] as const)
    assert.equal(canEstornar({ ...uso, status }), false);
  assert.equal(statusLabel("APROVADA"), "Aprovada");
  assert.equal(statusLabel("ESTORNADA"), "Estornada");
  assert.equal(statusLabel("EM_ANALISE"), "Em análise");
  assert.equal(statusLabel("DESCONTINUADO"), "Descontinuado");
});

test("operador e perfis do aplicativo não recebem acesso de administrador", () => {
  const data = createDemoData();
  assert.equal(isAdministrador({ perfil: "FCV_ADMINISTRADOR" }), true);
  assert.equal(isAdministrador({ perfil_id: 1 }, data), true);
  for (const perfil of [
    "FCV_OPERADOR",
    "COLABORADOR",
    "CONVENIADO",
    "Administrador",
    "fcv_administrador",
    "",
  ])
    assert.equal(isAdministrador({ perfil }), false);
  for (const perfil_id of [2, 3, 4, 999])
    assert.equal(isAdministrador({ perfil_id }, data), false);
  assert.equal(
    isAdministrador({ perfil: "FCV_OPERADOR", perfil_id: 1 }, data),
    false,
  );
  assert.equal(isAdministrador({}), false);
});

test("filtro temporal aceita os limites e recusa datas futuras ou inválidas", () => {
  const now = new Date("2026-10-13T18:00:00");
  assert.equal(withinPeriod("2026-10-06T00:00:00", 7, now), true);
  assert.equal(withinPeriod("2026-10-05T23:59:59", 7, now), false);
  assert.equal(withinPeriod("2026-10-13T18:00:00", 7, now), true);
  assert.equal(withinPeriod("2026-10-13T18:00:01", 7, now), false);
  assert.equal(withinPeriod("2026-10-14T00:00:00", 7, now), false);
  assert.equal(withinPeriod("data inválida", 7, now), false);
  assert.equal(withinPeriod("2020-01-01T00:00:00", 0, now), true);
});

test("dados de demonstração têm IDs, chaves únicas e referências coerentes", () => {
  const data = createDemoData();
  for (const [resource, rows] of Object.entries(data)) {
    assert.equal(
      new Set(rows.map((row: { id: number }) => row.id)).size,
      rows.length,
      `IDs duplicados: ${resource}`,
    );
    assert.ok(
      rows.every(
        (row: { id: number }) => Number.isInteger(row.id) && row.id > 0,
      ),
      `ID inválido: ${resource}`,
    );
  }
  const unique = (values: unknown[]) =>
    assert.equal(new Set(values).size, values.length);
  unique(data.usuarios.map((user) => user.email));
  unique(data.colaboradores.map((item) => item.usuario_id));
  unique(data.colaboradores.map((item) => item.matricula));
  unique(data.conveniados.map((item) => item.usuario_id));
  unique(data.conveniados.map((item) => item.cnpj));
  unique(
    data.ofertas.map((item) => `${item.beneficio_id}:${item.conveniado_id}`),
  );
  unique(
    data.ofertasCampanha.map(
      (item) => `${item.beneficio_campanha_id}:${item.conveniado_id}`,
    ),
  );
  unique(data.utilizacoes.map((item) => item.token_qrcode));
  for (const user of data.usuarios)
    assert.ok(data.perfis.some((perfil) => perfil.id === user.perfil_id));
  for (const item of data.colaboradores)
    assert.ok(data.usuarios.some((user) => user.id === item.usuario_id));
  for (const item of data.conveniados)
    assert.ok(data.usuarios.some((user) => user.id === item.usuario_id));
  for (const oferta of data.ofertas) {
    assert.ok(data.beneficios.some((item) => item.id === oferta.beneficio_id));
    assert.ok(
      data.conveniados.some((item) => item.id === oferta.conveniado_id),
    );
  }
  for (const item of data.itensCampanha)
    assert.ok(
      data.campanhas.some((campanha) => campanha.id === item.campanha_id),
    );
  for (const oferta of data.ofertasCampanha) {
    assert.ok(
      data.itensCampanha.some(
        (item) => item.id === oferta.beneficio_campanha_id,
      ),
    );
    assert.ok(
      data.conveniados.some((item) => item.id === oferta.conveniado_id),
    );
  }
  for (const uso of data.utilizacoes) {
    assert.equal(
      Number(uso.beneficio_conveniado_id != null) +
        Number(uso.beneficio_campanha_conveniado_id != null),
      1,
    );
    assert.ok(
      data.colaboradores.some((item) => item.id === uso.colaborador_id),
    );
    assert.ok(beneficioDaUtilizacao(data, uso));
    assert.ok(conveniadoDaUtilizacao(data, uso));
    assert.ok(Number.isFinite(uso.valor_aplicado) && uso.valor_aplicado >= 0);
    assert.ok(!Number.isNaN(new Date(uso.data_solicitacao).getTime()));
    if (uso.status === "PENDENTE") assert.equal(uso.data_confirmacao, null);
    if (uso.status === "ESTORNADA") assert.ok(uso.observacoes?.trim());
  }
  for (const campanha of data.campanhas)
    assert.ok(campanha.data_fim >= campanha.data_inicio);
  for (const beneficio of [...data.beneficios, ...data.itensCampanha]) {
    assert.ok(beneficio.valor > 0);
    if (beneficio.tipo_beneficio === "PERCENTUAL")
      assert.ok(beneficio.valor <= 100);
    if (beneficio.quantidade_maxima_utilizacoes != null)
      assert.ok(
        Number.isInteger(beneficio.quantidade_maxima_utilizacoes) &&
          beneficio.quantidade_maxima_utilizacoes > 0,
      );
  }
});
