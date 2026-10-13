import { buildReport } from "../models/reportSelectors";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Gift,
  Handshake,
  ClipboardCheck,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { PageHeader, StatCard, Badge } from "../components/ui";
import { usePortal } from "../viewmodels/PortalContext";
import { useAuth } from "../viewmodels/AuthContext";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  formatDate,
  withinPeriod,
} from "../models/selectors";
export default function Dashboard() {
  const { data } = usePortal();
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const usages = data.utilizacoes.filter((u) =>
    withinPeriod(u.data_solicitacao, days),
  );
  const approved = usages.filter((u) => u.status === "APROVADA");
  const today = new Date().toISOString().slice(0, 10);
  const first = [...usages].map(item => item.data_solicitacao.slice(0,10)).sort()[0] || today;
  const report = buildReport({...data, utilizacoes:usages}, first, today);
  const byBenefit = report.benefits.map(item => ({name:item.nome, count:item.count}));
  const least = [...byBenefit].sort((a,b) => a.count-b.count).slice(0,3);
  const colors = ["#0874db", "#23b797", "#ffd150", "#a477df", "#ed6798", "#65bfea"];
  let offset = 0;
  const stops = report.categories.map((item,index) => {
    const start = offset;
    offset += approved.length ? item.count / approved.length * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });
  const donut = stops.length ? `conic-gradient(${stops.join(",")})` : "#e8f1f8";
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
        title={`Olá, ${user!.nome.split(" ").slice(0,2).join(" ")}!`}
        description="Aqui está um resumo das utilizações e dos benefícios da Fundação."
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
          label="Total de utilizações"
          value={approved.length}
          icon={<ClipboardCheck />}
          detail="No período selecionado"
          tone="green"
        />
        <StatCard
          label="Benefícios utilizados"
          value={byBenefit.filter(item => item.count > 0).length}
          icon={<Gift />}
          detail="Com utilizações aprovadas no período"
          tone="purple"
        />
        <StatCard
          label="Colaboradores ativos"
          value={data.colaboradores.filter((c) => c.status === "ATIVO").length}
          icon={<Users />}
          detail="Pessoas com cadastro ativo"
        />
        <StatCard
          label="Benefícios pouco utilizados"
          value={byBenefit.filter(item => item.count === 0).length}
          icon={<Handshake />}
          detail="Sem utilizações aprovadas no período"
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
              <h2>Utilizações por categoria</h2>
            </div>
            <Link
              to="/relatorios"
              className="icon-button"
              aria-label="Abrir relatórios"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="category-chart">
            <div className="category-donut" style={{background:donut}} role="img" aria-label={`Distribuição de utilizações aprovadas: ${report.categories.map(item => `${item.nome}: ${item.count}`).join(", ") || "nenhuma utilização"}`}><div><strong>{approved.length}</strong><small>Total de utilizações</small></div></div>
            <div className="category-legend">{report.categories.map((item,index) => <div key={item.nome}><i style={{background:colors[index % colors.length]}} /><span>{item.nome}</span><strong>{approved.length ? Math.round(item.count/approved.length*100) : 0}%</strong></div>)}</div>
          </div>
          <p className="chart-caption">Categorias dos conveniados · Utilizações aprovadas no período</p>
        </section>
        <section className="panel"><div className="panel-header"><h2>Benefícios pouco utilizados</h2><Link className="button-link" to="/relatorios">Ver todos <ArrowUpRight size={15}/></Link></div><div className="least-benefits">{least.map((item,index) => <article key={item.name}><span className={`stat-icon ${index % 2 ? "green" : "purple"}`}><Gift size={22}/></span><div><strong>{item.name}</strong><small>{item.count} utilizações aprovadas</small><div className="bar-track"><div className={`bar-fill bar-color-${index}`} style={{width:`${item.count/maximum*100}%`}} /></div></div></article>)}</div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel"><div className="panel-header"><h2>Parceiros mais utilizados</h2><Link className="button-link" to="/conveniados">Ver todos <ArrowUpRight size={15}/></Link></div><div className="bar-chart">{report.partners.slice(0,5).map((item,index) => <div className="bar-row" key={item.id}><div><span className={`rank rank-${index}`}>{index+1}</span><span>{item.nome}</span><strong>{item.count}</strong></div><div className="bar-track"><div className="bar-fill" style={{width:`${approved.length ? item.count/approved.length*100 : 0}%`}} /></div></div>)}</div></section>
        <section className="panel"><div className="panel-header"><h2>Utilizações por tipo de benefício</h2></div><div className="benefit-columns">{byBenefit.slice(0,6).map((item,index) => <div key={item.name}><strong>{item.count}</strong><div style={{height:`${item.count/maximum*148}px`,background:colors[index % colors.length]}}/><small>{item.name}</small></div>)}</div><p className="chart-caption">Eixo vertical: utilizações aprovadas · Eixo horizontal: benefício</p></section>
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

      </div>
    </>
  );
}
