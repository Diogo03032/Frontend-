import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Gift,
  Handshake,
  ClipboardCheck,
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
} from "lucide-react";
import { PageHeader, StatCard, Badge } from "../components/ui";
import { usePortal } from "../viewmodels/PortalContext";
import { useAuth } from "../viewmodels/AuthContext";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  formatDate,
  formatMoney,
  withinPeriod,
} from "../models/selectors";
export default function Dashboard() {
  const { data } = usePortal();
  const { user } = useAuth();
  const [days, setDays] = useState(90);
  const usages = data.utilizacoes.filter((u) =>
    withinPeriod(u.data_solicitacao, days),
  );
  const approved = usages.filter((u) => u.status === "APROVADA");
  const total = approved.reduce((sum, u) => sum + Number(u.valor_aplicado), 0);
  const byBenefit = data.beneficios
    .map((b) => ({
      name: b.nome,
      count: approved.filter(
        (u) =>
          u.beneficio_conveniado_id &&
          data.ofertas.find((o) => o.id === u.beneficio_conveniado_id)
            ?.beneficio_id === b.id,
      ).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maximum = Math.max(1, ...byBenefit.map((b) => b.count));
  const latest = [...usages]
    .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao))
    .slice(0, 5);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const count = approved.filter((u) => {
      const date = new Date(u.data_solicitacao);
      return (
        date.getMonth() === d.getMonth() &&
        date.getFullYear() === d.getFullYear()
      );
    }).length;
    return {
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      count,
    };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.count));
  const chartPoints = months
    .map((m, i) => `${40 + i * 86},${175 - (m.count / maxMonth) * 130}`)
    .join(" ");
  return (
    <>
      <PageHeader
        title={`Olá, ${user!.nome.split(" ")[0]}!`}
        description="Uma visão do cuidado que a Fundação transforma em benefícios."
        actions={
          <label className="period-control">
            <CalendarDays size={17} />
            <select
              aria-label="Período do dashboard"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={365}>Últimos 12 meses</option>
              <option value={0}>Todo o período</option>
            </select>
          </label>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Utilizações aprovadas"
          value={approved.length}
          icon={<ClipboardCheck />}
          detail="No período selecionado"
          tone="green"
        />
        <StatCard
          label="Benefícios ativos"
          value={data.beneficios.filter((b) => b.status === "ATIVO").length}
          icon={<Gift />}
          detail="Cuidado em diferentes áreas"
          tone="purple"
        />
        <StatCard
          label="Colaboradores ativos"
          value={data.colaboradores.filter((c) => c.status === "ATIVO").length}
          icon={<Users />}
          detail="Pessoas com cadastro ativo"
        />
        <StatCard
          label="Conveniados ativos"
          value={data.conveniados.filter((c) => c.status === "ATIVO").length}
          icon={<Handshake />}
          detail="Parcerias que fazem diferença"
          tone="amber"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel dashboard-chart">
          <div className="panel-header">
            <div>
              <span className="eyebrow">ACOMPANHAMENTO</span>
              <h2>Utilizações por mês</h2>
            </div>
            <span className="chart-legend">
              <i />
              Aprovadas
            </span>
          </div>
          <div className="line-chart">
            <svg
              viewBox="0 0 520 215"
              role="img"
              aria-label={`Utilizações aprovadas: ${months.map((m) => `${m.label}: ${m.count}`).join(", ")}`}
            >
              <title>
                Utilizações aprovadas nos últimos seis meses dentro do período
                selecionado
              </title>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <line
                    x1="40"
                    y1={175 - i * 43}
                    x2="485"
                    y2={175 - i * 43}
                    className="grid-line"
                  />
                  <text x="10" y={179 - i * 43}>
                    {Math.round((maxMonth * i) / 3)}
                  </text>
                </g>
              ))}
              <polygon
                points={`40,175 ${chartPoints} 470,175`}
                className="chart-area"
              />
              <polyline points={chartPoints} className="chart-line" />
              {months.map((m, i) => (
                <g key={i}>
                  <circle
                    cx={40 + i * 86}
                    cy={175 - (m.count / maxMonth) * 130}
                    r="5"
                    className="chart-dot"
                  />
                  <text x={40 + i * 86} y="202" textAnchor="middle">
                    {m.label}
                  </text>
                </g>
              ))}
            </svg>
            <p className="chart-caption">
              Eixo vertical: utilizações aprovadas · Eixo horizontal: mês ·
              Fonte: registros do portal
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">PREFERÊNCIAS</span>
              <h2>Benefícios mais utilizados</h2>
            </div>
            <Link
              to="/relatorios"
              className="icon-button"
              aria-label="Abrir relatórios"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="bar-chart">
            {byBenefit.slice(0, 5).map((b, i) => (
              <div className="bar-row" key={b.name}>
                <div>
                  <span className={`rank rank-${i}`}>{i + 1}</span>
                  <span>{b.name}</span>
                  <strong>{b.count}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill bar-color-${i % 4}`}
                    style={{ width: `${(b.count / maximum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="chart-caption">
            Número de utilizações aprovadas no período selecionado
          </p>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">HISTÓRICO RECENTE</span>
              <h2>Últimas utilizações</h2>
            </div>
            <Link to="/utilizacoes" className="button-link">
              Ver todas <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="recent-list">
            {latest.map((u) => (
              <div className="recent-row" key={u.id}>
                <span className="recent-icon">
                  <Gift size={18} />
                </span>
                <div>
                  <strong>
                    {beneficioDaUtilizacao(data, u)?.nome ?? "Benefício"}
                  </strong>
                  <small>
                    {colaboradorNome(data, u.colaborador_id)} ·{" "}
                    {conveniadoDaUtilizacao(data, u)?.nome_fantasia}
                  </small>
                </div>
                <span className="recent-date">
                  {formatDate(u.data_solicitacao)}
                </span>
                <Badge status={u.status} />
              </div>
            ))}
            {!latest.length && (
              <p className="text-muted">Nenhuma utilização neste período.</p>
            )}
          </div>
        </section>
        <section className="care-card">
          <HeartHandshake size={29} />
          <span className="eyebrow">CUIDAR DE QUEM CUIDA</span>
          <h2>
            Pequenas parcerias.
            <br />
            Grandes possibilidades.
          </h2>
          <p>
            Acompanhe as campanhas e amplie o alcance dos benefícios para nossos
            colaboradores.
          </p>
          <div className="care-stat">
            <strong>{formatMoney(total)}</strong>
            <span>Valor aplicado nas utilizações aprovadas</span>
          </div>
          <Link to="/campanhas">
            Conhecer campanhas <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
    </>
  );
}
