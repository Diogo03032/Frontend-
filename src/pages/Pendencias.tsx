import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Handshake, Info, ListChecks, RefreshCw } from "lucide-react";
import { usePortal } from "../viewmodels/PortalContext";
import { formatDate } from "../models/selectors";
import { filterPendingOperations, pendingOperations, type PendingOperation } from "../models/operationsSelectors";
import { Badge, DataTable, EmptyState, Field, PageHeader, Pagination, SearchField, StatCard } from "../components/ui";
import "../styles/operations.css";

const PAGE_SIZE = 8;
const kindLabel = (row: PendingOperation) => row.kind === "CONVENIADO" ? "Conveniado" : "Utilização";

export default function Pendencias() {
  const { data, reload, loading } = usePortal();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const allRows = useMemo(() => pendingOperations(data), [data]);
  const rows = useMemo(() => filterPendingOperations(allRows, search, kind), [allRows, search, kind]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function clearFilters() { setSearch(""); setKind(""); setPage(1); }

  return <>
    <PageHeader eyebrow="ACOMPANHAMENTO" title="Central de pendências" description="Consulte os conveniados em análise e as solicitações de utilização que aguardam confirmação." actions={<button className="btn btn-secondary" onClick={() => void reload()} disabled={loading}><RefreshCw size={17} />{loading ? "Atualizando…" : "Atualizar pendências"}</button>} />
    <div className="stats-grid operations-stats">
      <StatCard label="Pendências no portal" value={allRows.length} icon={<ListChecks />} detail="Total de registros aguardando encaminhamento" />
      <StatCard label="Conveniados em análise" value={allRows.filter(row => row.kind === "CONVENIADO").length} icon={<Handshake />} tone="purple" detail="Cadastros com status Em análise" />
      <StatCard label="Utilizações pendentes" value={allRows.filter(row => row.kind === "UTILIZACAO").length} icon={<ClipboardList />} tone="amber" detail="Solicitações ainda não confirmadas" />
    </div>
    <div className="pending-layout">
      <section className="panel pending-panel" aria-labelledby="pending-list-title">
        <div className="panel-header"><div><h2 id="pending-list-title">Registros para acompanhamento</h2><p className="text-muted">Abra um registro para consultar os dados e o encaminhamento disponível.</p></div><span className="result-count">{rows.length} {rows.length === 1 ? "resultado" : "resultados"}</span></div>
        <div className="filters pending-filters"><SearchField value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Buscar pessoa, benefício, conveniado ou número" /><Field label="Tipo de pendência"><select value={kind} onChange={event => { setKind(event.target.value); setPage(1); }}><option value="">Todos os tipos</option><option value="CONVENIADO">Conveniado em análise</option><option value="UTILIZACAO">Utilização pendente</option></select></Field>{(search || kind) && <button className="btn btn-secondary" onClick={clearFilters}>Limpar filtros</button>}</div>
        {rows.length ? <>
          <div className="pending-desktop-table"><DataTable rows={visible} getRowKey={row => row.key} columns={[
            { key: "record", label: "Registro", render: row => <><Link className="cell-title pending-record-link" to={row.href}>{row.title}</Link><span className="cell-subtitle">{row.subtitle}</span></> },
            { key: "type", label: "Tipo e referência", render: row => <><span className="cell-title">{kindLabel(row)}</span><span className="cell-subtitle">#{String(row.id).padStart(5, "0")}</span></> },
            { key: "detail", label: "Contexto", render: row => <><span>{row.detail}</span>{row.date && <span className="cell-subtitle">Solicitado em {formatDate(row.date, true)}</span>}</> },
            { key: "status", label: "Status", render: row => <Badge status={row.status} /> },
            { key: "action", label: "Ação", render: row => <Link className="btn btn-secondary btn-small pending-open" to={row.href} aria-label={`Examinar ${kindLabel(row).toLocaleLowerCase("pt-BR")} ${row.title}`}>Examinar <ArrowRight size={15} /></Link> },
          ]} /></div>
          <div className="pending-mobile-list">{visible.map(row => <article className="pending-mobile-card" key={row.key}><div className="pending-mobile-top"><span>{kindLabel(row)} #{String(row.id).padStart(5, "0")}</span><Badge status={row.status} /></div><h3><Link to={row.href}>{row.title}</Link></h3><p>{row.subtitle}</p><p className="text-muted">{row.detail}</p>{row.date && <small>Solicitado em {formatDate(row.date, true)}</small>}<Link className="calendar-detail-link" to={row.href}>Examinar registro <ArrowRight size={16} /></Link></article>)}</div>
        </> : <EmptyState title={allRows.length ? "Nenhuma pendência encontrada" : "Nenhuma pendência no momento"} description={allRows.length ? "Ajuste a busca ou o tipo de pendência para consultar outros registros." : "Os cadastros em análise e as utilizações pendentes aparecerão aqui quando forem registrados."} action={allRows.length ? <button className="btn btn-secondary" onClick={clearFilters}>Limpar filtros</button> : undefined} />}
        <Pagination page={currentPage} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </section>
      <aside className="panel pending-guide" aria-labelledby="pending-guide-title"><div className="pending-guide-icon"><Info size={24} /></div><h2 id="pending-guide-title">Próximas ações</h2><p className="text-muted">Cada tipo de pendência segue o fluxo do seu registro.</p><ol><li><strong>Revise o conveniado</strong><p>Confira os dados cadastrais e os benefícios vinculados. A atualização do status está disponível na edição do cadastro.</p><Link to="/conveniados">Consultar conveniados <ArrowRight size={15} /></Link></li><li><strong>Acompanhe a utilização</strong><p>Consulte o benefício, o colaborador e o canal de validação. A confirmação do uso ocorre pelo canal responsável: aplicativo do conveniado ou terminal IoT.</p><Link to="/utilizacoes?status=PENDENTE">Ver utilizações pendentes <ArrowRight size={15} /></Link></li></ol><div className="pending-guide-note">O status exibido acompanha os dados recebidos da API. Atualize os dados pelo botão do portal para consultar novas confirmações.</div></aside>
    </div>
  </>;
}
