import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Eye } from "lucide-react";
import type { Utilizacao } from "../models/types";
import { beneficioDaUtilizacao, colaboradorNome, conveniadoDaUtilizacao, formatDate, formatMoney } from "../models/selectors";
import { filterUsageHistory, usageMonthSeries } from "../models/detailSelectors";
import { usePortal } from "../viewmodels/PortalContext";
import { Badge, DataTable, EmptyState, Pagination, SearchField } from "./ui";

export function DetailBreadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return <nav className="detail-breadcrumb" aria-label="Localização"><ol>
    <li><Link to="/">Início</Link></li>
    {items.map((item, index) => <li key={`${item.label}-${index}`}>
      <ChevronRight size={14} aria-hidden="true" />
      {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
    </li>)}
  </ol></nav>;
}

export function DetailNotFound({ title, backTo, backLabel }: { title: string; backTo: string; backLabel: string }) {
  return <section className="panel detail-card detail-not-found">
    <h1>{title}</h1><p>O registro não está disponível. Confira o endereço ou volte à lista para selecionar outro cadastro.</p>
    <Link className="btn btn-primary" to={backTo}><ArrowLeft size={17} />{backLabel}</Link>
  </section>;
}

export function UsageHistory({ usages, title = "Histórico de utilizações" }: { usages: Utilizacao[]; title?: string }) {
  const { data } = usePortal();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const rows = filterUsageHistory(usages, search, status, usage =>
    `${colaboradorNome(data, usage.colaborador_id)} ${beneficioDaUtilizacao(data, usage)?.nome ?? ""} ${conveniadoDaUtilizacao(data, usage)?.nome_fantasia ?? ""}`);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 6)));
  return <section className="panel detail-history" aria-label={title}>
    <div className="panel-header"><div><h2>{title}</h2><p className="detail-subtitle">Todos os registros deste cadastro, do mais recente ao mais antigo.</p></div></div>
    {usages.length ? <>
      <div className="filters">
        <SearchField placeholder="Buscar no histórico por nome, benefício ou número..." value={search} onChange={value => { setSearch(value); setPage(1); }} />
        <select aria-label="Filtrar histórico por status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
          <option value="">Todos os status</option><option value="APROVADA">Aprovadas</option><option value="PENDENTE">Pendentes</option><option value="REPROVADA">Reprovadas</option><option value="ESTORNADA">Estornadas</option>
        </select>
      </div>
      <DataTable rows={rows.slice((currentPage - 1) * 6, currentPage * 6)} getRowKey={usage => usage.id} columns={[
        { key: "colaborador", label: "Colaborador", render: usage => data.colaboradores.some(item => item.id === usage.colaborador_id)
          ? <Link className="detail-record-link" to={`/colaboradores/${usage.colaborador_id}`}>{colaboradorNome(data, usage.colaborador_id)}</Link>
          : colaboradorNome(data, usage.colaborador_id) },
        { key: "beneficio", label: "Benefício / conveniado", render: usage => {
          const benefit = beneficioDaUtilizacao(data, usage);
          const partner = conveniadoDaUtilizacao(data, usage);
          const campaignItem = usage.beneficio_campanha_conveniado_id
            ? data.itensCampanha.find(item => item.id === benefit?.id) : undefined;
          const to = usage.beneficio_conveniado_id ? `/beneficios/${benefit?.id}` : campaignItem ? `/campanhas/${campaignItem.campanha_id}` : undefined;
          return <div>{benefit && to ? <Link className="detail-record-link" to={to}>{benefit.nome}</Link> : <strong>{benefit?.nome ?? "Benefício não disponível"}</strong>}
            <div className="cell-subtitle">{partner ? <Link to={`/conveniados/${partner.id}`}>{partner.nome_fantasia}</Link> : "Conveniado não disponível"}</div></div>;
        } },
        { key: "data", label: "Solicitada em", render: usage => formatDate(usage.data_solicitacao, true) },
        { key: "valor", label: "Valor aplicado", render: usage => formatMoney(usage.valor_aplicado) },
        { key: "status", label: "Situação", render: usage => <Badge status={usage.status} /> },
        { key: "acao", label: "Detalhes", render: usage => <Link className="icon-button" to={`/utilizacoes?utilizacao=${usage.id}`} aria-label={`Ver utilização #${usage.id}`}><Eye size={18} /></Link> },
      ]} />
      <Pagination page={currentPage} total={rows.length} pageSize={6} onChange={setPage} />
    </> : <EmptyState title="Nenhuma utilização registrada" description="Os registros aparecerão aqui quando houver utilizações vinculadas a este cadastro." />}
  </section>;
}

export function UsageChart({ usages }: { usages: Utilizacao[] }) {
  const series = usageMonthSeries(usages);
  const max = Math.max(1, ...series.map(item => item.count));
  const total = series.reduce((sum, item) => sum + item.count, 0);
  return <section className="panel detail-chart">
    <div className="panel-header"><div><h2>Utilizações nos últimos seis meses</h2><p className="detail-subtitle">Somente aprovadas, agrupadas pelo mês da solicitação.</p></div></div>
    <figure>
      <ul className="detail-chart-bars" aria-label="Quantidade de utilizações aprovadas por mês">
        {series.map(item => <li key={item.key}>
          <div className="detail-chart-track"><span>{item.count}</span><div className="detail-chart-bar" style={{ height: `${Math.max(item.count ? 4 : 0, item.count / max * 130)}px` }} /></div>
          <span>{item.label}</span>
        </li>)}
      </ul>
      <figcaption>{total ? `${total} ${total === 1 ? "utilização aprovada no período" : "utilizações aprovadas no período"}.` : "Nenhuma utilização aprovada nesse período."}</figcaption>
    </figure>
  </section>;
}
