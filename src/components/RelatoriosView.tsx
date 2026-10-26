import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Info,
  Users,
} from "lucide-react";
import { formatDate, formatMoney, statusLabel } from "../models/selectors";
import type { useRelatoriosVM } from "../viewmodels/useRelatoriosVM";
import {
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  StatCard,
} from "./ui";
import { REPORT_PAGE_SIZE } from "../viewmodels/useRelatoriosVM";

const TABS = [
  { id: "utilizacoes", label: "Utilizações" },
  { id: "adesao", label: "Adesão" },
  { id: "beneficios", label: "Benefícios" },
  { id: "periodo", label: "Dados por período" },
  { id: "conveniados", label: "Conveniados" },
];
function Bars({
  items,
  percent = false,
  tone = "blue",
}: {
  items: { nome: string; count: number }[];
  percent?: boolean;
  tone?: string;
}) {
  const max = percent ? 100 : Math.max(1, ...items.map((item) => item.count));
  if (!items.length)
    return (
      <EmptyState
        title="Sem dados no período"
        description="Escolha outro intervalo para visualizar os indicadores."
      />
    );
  return (
    <div className="bar-chart">
      {items.map((item, index) => (
        <div className="bar-row" key={`${item.nome}-${index}`}>
          <div className="bar-label">
            <span title={item.nome}>{item.nome}</span>
            <strong>
              {percent
                ? `${item.count.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                : item.count.toLocaleString("pt-BR")}
            </strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${tone}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
export default function RelatoriosView(props: ReturnType<typeof useRelatoriosVM>) {
  const {
    inicio, fim, tab, setInicio, setFim, setPage, changeTab, report, delta,
    benefitPage, partnerPage, periodPage, campaignPage, statusCounts, exportar,
  } = props;

  return (
    <>
      <PageHeader
        eyebrow="INTELIGÊNCIA E GESTÃO"
        title="Relatórios"
        description="Transforme os registros de utilização em informações para a fundação."
        actions={
          <button
            className="btn btn-secondary"
            onClick={exportar}
            disabled={!report.valid || !report.filtered.length}
          >
            <Download size={17} /> Exportar utilizações (CSV)
          </button>
        }
      />
      <section className="panel report-period">
        <div>
          <h2>Período de análise</h2>
          <p className="text-muted">
            O intervalo considera a data da solicitação e o status atual do
            registro.
          </p>
        </div>
        <div className="filters">
          <Field label="De" required>
            <input
              type="date"
              value={inicio}
              onChange={(event) => {
                setInicio(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field
            label="Até"
            required
            error={!report.valid ? "Informe um período válido." : undefined}
          >
            <input
              type="date"
              min={inicio || undefined}
              value={fim}
              onChange={(event) => {
                setFim(event.target.value);
                setPage(1);
              }}
            />
          </Field>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard
          label="Resgates aprovados"
          value={report.approved.length}
          icon={<CheckCircle2 />}
          detail={
            delta == null
              ? "Sem base no período anterior"
              : `${delta > 0 ? "+" : ""}${delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% em relação ao período anterior`
          }
        />
        <StatCard
          label="Colaboradores participantes"
          value={report.participantes}
          icon={<Users />}
          tone="green"
          detail="Pessoas com ao menos um resgate aprovado"
        />
        <StatCard
          label="Valor aplicado"
          value={formatMoney(report.totalValor)}
          icon={<CircleDollarSign />}
          tone="purple"
          detail="Total registrado nas utilizações aprovadas"
        />
        <StatCard
          label="Custo médio por participante"
          value={formatMoney(report.custoMedio)}
          icon={<BarChart3 />}
          tone="amber"
          detail="Valor aplicado ÷ participantes únicos"
        />
      </div>
      <div className="tabs" role="tablist" aria-label="Tipos de relatório">
        {TABS.map((item) => (
          <button
            type="button"
            key={item.id}
            id={`tab-${item.id}`}
            className={`tab ${tab === item.id ? "active" : ""}`}
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`report-${item.id}`}
            onClick={() => changeTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`report-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "utilizacoes" && (
          <>
            <div className="chart-grid">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Comparativo de resgates</h2>
                    <p className="text-muted">
                      Períodos consecutivos com a mesma quantidade de dias.
                    </p>
                  </div>
                </div>
                <div className="comparison-grid">
                  <div className="comparison-card">
                    <span>Período selecionado</span>
                    <strong>{report.approved.length}</strong>
                    <small>
                      {formatDate(inicio)} a {formatDate(fim)}
                    </small>
                  </div>
                  <div className="comparison-card muted">
                    <span>Período anterior</span>
                    <strong>{report.previous.length}</strong>
                    <small>
                      {formatDate(report.previousStart)} a{" "}
                      {formatDate(report.previousEnd)}
                    </small>
                  </div>
                </div>
                <p className="report-note">
                  São contadas apenas utilizações aprovadas. Estornos e
                  reprovações não compõem o valor aplicado.
                </p>
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Por categoria de conveniado</h2>
                    <p className="text-muted">
                      Resgates aprovados por categoria do parceiro.
                    </p>
                  </div>
                </div>
                <Bars items={report.categories} tone="purple" />
              </section>
            </div>
            <div className="chart-grid">
              <section className="panel">
                <div className="panel-header">
                  <h2>Benefícios mais utilizados</h2>
                </div>
                <Bars items={report.benefits.slice(0, 5)} />
              </section>
              <section className="panel">
                <div className="panel-header">
                  <h2>Conveniados mais utilizados</h2>
                </div>
                <Bars items={report.partners.slice(0, 5)} tone="green" />
              </section>
            </div>
            <section className="panel">
              <div className="panel-header">
                <h2>Situação dos registros</h2>
                <span className="text-muted">
                  {report.filtered.length} solicitações no período
                </span>
              </div>
              <div className="status-summary">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <span>{statusLabel(status)}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {tab === "adesao" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Adesão dos colaboradores ativos</h2>
                  <p className="text-muted">
                    {report.ativosParticipantes} de {report.ativos}{" "}
                    colaboradores atualmente ativos utilizaram um benefício no
                    período.
                  </p>
                </div>
                <strong className="report-highlight">
                  {report.taxaAdesao.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </strong>
              </div>
              <Bars
                items={[
                  {
                    nome: "Colaboradores ativos com resgate aprovado",
                    count: report.taxaAdesao,
                  },
                ]}
                percent
                tone="green"
              />
              <p className="report-note">
                <Info size={16} /> Taxa observada = colaboradores atualmente
                ativos com resgate aprovado ÷ total de colaboradores atualmente
                ativos. A base cadastral é atual e não representa um retrato
                histórico de elegibilidade.
              </p>
            </section>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Adesão a campanhas e eventos</h2>
                  <p className="text-muted">
                    Iniciativas cujo período coincide com o intervalo
                    selecionado.
                  </p>
                </div>
              </div>
              {report.campaigns.length ? (
                <DataTable
                  rows={campaignPage.rows}
                  getRowKey={(row) => row.id}
                  columns={[
                    {
                      key: "campanha",
                      label: "Iniciativa",
                      render: (row) => (
                        <span className="cell-title">{row.nome}</span>
                      ),
                    },
                    {
                      key: "resgates",
                      label: "Resgates aprovados",
                      render: (row) => row.count,
                    },
                    {
                      key: "participantes",
                      label: "Participantes únicos",
                      render: (row) => row.participantes,
                    },
                    {
                      key: "taxa",
                      label: "Adesão da base ativa",
                      render: (row) =>
                        `${row.taxa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
                    },
                  ]}
                />
              ) : (
                <EmptyState
                  title="Nenhuma campanha no período"
                  description="Selecione um intervalo que coincida com uma iniciativa cadastrada."
                />
              )}
              <Pagination
                page={campaignPage.current}
                total={report.campaigns.length}
                pageSize={REPORT_PAGE_SIZE}
                onChange={setPage}
              />
              <p className="report-note">
                A taxa usa a mesma base atual de colaboradores ativos. Os
                participantes únicos incluem todos os colaboradores com resgate
                aprovado da iniciativa.
              </p>
            </section>
          </>
        )}
        {tab === "beneficios" && (
          <>
            <div className="chart-grid">
              <section className="panel">
                <div className="panel-header">
                  <h2>Mais utilizados</h2>
                </div>
                <Bars items={report.benefits.slice(0, 5)} />
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Menos utilizados</h2>
                    <p className="text-muted">
                      Inclui benefícios sem resgates no período.
                    </p>
                  </div>
                </div>
                <Bars
                  items={[...report.benefits]
                    .sort(
                      (a, b) =>
                        a.count - b.count || a.nome.localeCompare(b.nome),
                    )
                    .slice(0, 5)}
                  tone="amber"
                />
              </section>
            </div>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Indicadores por benefício</h2>
                  <p className="text-muted">
                    Benefícios regulares e itens promocionais do cadastro atual.
                  </p>
                </div>
              </div>
              {report.benefits.length ? (
                <DataTable
                  rows={benefitPage.rows}
                  getRowKey={(row) => row.key}
                  columns={[
                    {
                      key: "nome",
                      label: "Benefício",
                      render: (row) => (
                        <>
                          <span className="cell-title">{row.nome}</span>
                          <span className="cell-subtitle">{row.origem}</span>
                        </>
                      ),
                    },
                    {
                      key: "count",
                      label: "Resgates aprovados",
                      render: (row) => row.count,
                    },
                    {
                      key: "participantes",
                      label: "Participantes únicos",
                      render: (row) => row.participantes,
                    },
                    {
                      key: "taxa",
                      label: "Adesão da base ativa",
                      render: (row) =>
                        `${row.taxa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
                    },
                    {
                      key: "valor",
                      label: "Valor aplicado",
                      render: (row) => formatMoney(row.valor),
                    },
                  ]}
                />
              ) : (
                <EmptyState title="Nenhum benefício cadastrado" />
              )}
              <Pagination
                page={benefitPage.current}
                total={report.benefits.length}
                pageSize={REPORT_PAGE_SIZE}
                onChange={setPage}
              />
              <p className="report-note">
                Adesão por benefício = colaboradores atualmente ativos com
                resgate aprovado do benefício ÷ base atual de colaboradores
                ativos.
              </p>
            </section>
          </>
        )}
        {tab === "periodo" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Utilizações ao longo do tempo</h2>
                  <p className="text-muted">
                    Últimos 12 meses com registros dentro do intervalo
                    selecionado.
                  </p>
                </div>
              </div>
              <Bars items={report.periods.slice(-12)} />
            </section>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Dados mensais</h2>
                  <p className="text-muted">
                    Meses com registros. O primeiro e o último mês podem estar
                    parciais.
                  </p>
                </div>
              </div>
              {report.periods.length ? (
                <DataTable
                  rows={periodPage.rows}
                  getRowKey={(row) => row.key}
                  columns={[
                    {
                      key: "mes",
                      label: "Mês",
                      render: (row) => (
                        <span className="cell-title">{row.nome}</span>
                      ),
                    },
                    {
                      key: "registros",
                      label: "Solicitações",
                      render: (row) => row.registros,
                    },
                    {
                      key: "count",
                      label: "Aprovadas",
                      render: (row) => row.count,
                    },
                    {
                      key: "participantes",
                      label: "Participantes únicos",
                      render: (row) => row.participantes,
                    },
                    {
                      key: "valor",
                      label: "Valor aplicado",
                      render: (row) => formatMoney(row.valor),
                    },
                  ]}
                />
              ) : (
                <EmptyState title="Nenhum registro no período" />
              )}
              <Pagination
                page={periodPage.current}
                total={report.periods.length}
                pageSize={REPORT_PAGE_SIZE}
                onChange={setPage}
              />
            </section>
          </>
        )}
        {tab === "conveniados" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Parceiros mais utilizados</h2>
                  <p className="text-muted">
                    Até oito conveniados com mais resgates aprovados no período.
                  </p>
                </div>
              </div>
              <Bars items={report.partners.slice(0, 8)} tone="green" />
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>Indicadores por conveniado</h2>
              </div>
              {report.partners.length ? (
                <DataTable
                  rows={partnerPage.rows}
                  getRowKey={(row) => row.id}
                  columns={[
                    {
                      key: "nome",
                      label: "Conveniado",
                      render: (row) => (
                        <>
                          <span className="cell-title">{row.nome}</span>
                          <span className="cell-subtitle">{row.categoria}</span>
                        </>
                      ),
                    },
                    {
                      key: "count",
                      label: "Resgates aprovados",
                      render: (row) => row.count,
                    },
                    {
                      key: "participantes",
                      label: "Participantes únicos",
                      render: (row) => row.participantes,
                    },
                    {
                      key: "valor",
                      label: "Valor aplicado",
                      render: (row) => formatMoney(row.valor),
                    },
                    {
                      key: "medio",
                      label: "Valor médio por resgate",
                      render: (row) =>
                        formatMoney(row.count ? row.valor / row.count : 0),
                    },
                  ]}
                />
              ) : (
                <EmptyState title="Nenhum conveniado cadastrado" />
              )}
              <Pagination
                page={partnerPage.current}
                total={report.partners.length}
                pageSize={REPORT_PAGE_SIZE}
                onChange={setPage}
              />
            </section>
          </>
        )}
      </div>
      <p className="report-note">
        <Info size={16} /> Os indicadores são calculados a partir dos dados
        carregados no portal. “Valor aplicado” é o valor registrado no resgate e
        não comprova despesa contábil. O CSV exporta todas as solicitações do
        intervalo, incluindo pendentes, reprovadas e estornadas.
      </p>
    </>
  );
}
