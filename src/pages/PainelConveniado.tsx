import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CalendarDays, ClipboardCheck, Gift, Handshake, Pencil, Wallet } from "lucide-react";
import { Badge, DetailList, EmptyState, PageHeader, StatCard } from "../components/ui";
import { DetailBreadcrumb, DetailNotFound, UsageChart, UsageHistory } from "../components/DetailWidgets";
import { conveniadoDaUtilizacao, formatCnpj, formatDate, formatMoney, initials } from "../models/selectors";
import { usePortal } from "../viewmodels/PortalContext";
import "../styles/entity-details.css";

export default function PainelConveniado() {
  const { id = "" } = useParams();
  const { data } = usePortal();
  const recordId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : undefined;
  const conveniado = data.conveniados.find(item => item.id === recordId);

  if (!conveniado) return <DetailNotFound title="Conveniado não encontrado" backTo="/conveniados" backLabel="Voltar aos conveniados" />;

  const responsavel = data.usuarios.find(item => item.id === conveniado.usuario_id);
  const usos = data.utilizacoes.filter(item => conveniadoDaUtilizacao(data, item)?.id === conveniado.id);
  const aprovados = usos.filter(item => item.status === "APROVADA");
  const valorAplicado = aprovados.reduce((total, item) => total + Number(item.valor_aplicado || 0), 0);
  const ofertas = data.ofertas.filter(item => item.conveniado_id === conveniado.id);
  const ofertasCampanha = data.ofertasCampanha.filter(item => item.conveniado_id === conveniado.id);

  return <>
    <DetailBreadcrumb items={[{ label: "Conveniados", to: "/conveniados" }, { label: conveniado.nome_fantasia }]} />
    <PageHeader
      eyebrow="REDE DE PARCEIROS"
      title="Painel do conveniado"
      description="Acompanhe os benefícios oferecidos e as utilizações neste estabelecimento."
      actions={<>
        <Link to="/conveniados" className="btn btn-secondary"><ArrowLeft size={16} aria-hidden="true" />Voltar</Link>
        <Link to={`/conveniados?editar=${conveniado.id}`} className="btn btn-primary"><Pencil size={16} aria-hidden="true" />Editar cadastro</Link>
      </>}
    />
    <div className="detail-grid entity-detail-page">
      <aside className="detail-sidebar">
        <section className="panel detail-card entity-identity" aria-labelledby="partner-name">
          <span className="detail-avatar" aria-hidden="true">{initials(conveniado.nome_fantasia)}</span>
          <h2 id="partner-name">{conveniado.nome_fantasia}</h2>
          <p className="detail-subtitle">{conveniado.categoria}</p>
          <Badge status={conveniado.status} />
          <span className="entity-identity-caption">{formatCnpj(conveniado.cnpj)}</span>
        </section>
        <section className="panel detail-card" aria-labelledby="partner-registration">
          <h2 className="detail-section-title" id="partner-registration">Dados do estabelecimento</h2>
          <DetailList items={[
            { label: "Razão social", value: conveniado.razao_social },
            { label: "Categoria", value: conveniado.categoria },
            { label: "Endereço", value: conveniado.endereco },
            { label: "Responsável", value: responsavel?.nome || "Conta não disponível" },
            { label: "E-mail do responsável", value: responsavel?.email || "Não informado" },
            { label: "Status da conta", value: responsavel ? <Badge status={responsavel.status} /> : "Conta não disponível" },
          ]} />
        </section>
        <div className="entity-information"><Handshake size={18} aria-hidden="true" /><p>Consulte os vínculos do estabelecimento com benefícios comuns e itens de campanhas, preservando o histórico de utilizações.</p></div>
      </aside>
      <div className="detail-main">
        <div className="detail-stats stats-grid">
          <StatCard label="Utilizações aprovadas" value={aprovados.length} detail={`${usos.length} solicitações no histórico`} icon={<ClipboardCheck size={21} aria-hidden="true" />} tone="green" />
          <StatCard label="Valor aplicado" value={formatMoney(valorAplicado)} detail="Somente utilizações aprovadas" icon={<Wallet size={21} aria-hidden="true" />} />
          <StatCard label="Ofertas cadastradas" value={ofertas.length + ofertasCampanha.length} detail={`${ofertas.length} comuns · ${ofertasCampanha.length} de campanhas`} icon={<Gift size={21} aria-hidden="true" />} tone="purple" />
        </div>
        <nav className="detail-tabs" aria-label="Seções do painel do conveniado">
          <a href="#partner-offers">Benefícios oferecidos</a>
          <a href="#partner-campaigns">Campanhas</a>
          <a href="#partner-history">Histórico de utilizações</a>
        </nav>
        <UsageChart usages={usos} />
        <div className="detail-two-columns">
          <section id="partner-offers" className="panel detail-card entity-anchor-section" aria-labelledby="partner-offer-title">
            <div className="detail-heading"><Gift size={20} aria-hidden="true" /><h2 className="detail-section-title" id="partner-offer-title">Benefícios oferecidos</h2></div>
            <p className="detail-text">Vínculos cadastrados para este conveniado, incluindo os inativos.</p>
            {ofertas.length ? <ul className="detail-link-list">
              {ofertas.map(oferta => {
                const beneficio = data.beneficios.find(item => item.id === oferta.beneficio_id);
                return <li key={oferta.id} className="detail-list-item">
                  <div>
                    {beneficio ? <Link className="entity-record-link" to={`/beneficios/${beneficio.id}`}>{beneficio.nome}<ArrowUpRight size={15} aria-hidden="true" /></Link> : <span className="entity-record-link">Benefício #{oferta.beneficio_id} indisponível</span>}
                    <span className="entity-row-note">{beneficio ? beneficio.tipo_beneficio === "PERCENTUAL" ? `${Number(beneficio.valor)}% de desconto` : formatMoney(beneficio.valor) : "Cadastro não encontrado"}</span>
                    {beneficio && <span className="entity-row-note">Benefício: <Badge status={beneficio.status} /></span>}
                  </div>
                  <div className="entity-offer-status"><span>Vínculo</span><Badge status={oferta.status} /></div>
                </li>;
              })}
            </ul> : <EmptyState title="Nenhum benefício comum vinculado" description="Os vínculos cadastrados em Benefícios serão apresentados aqui." />}
          </section>
          <section id="partner-campaigns" className="panel detail-card entity-anchor-section" aria-labelledby="partner-campaign-title">
            <div className="detail-heading"><CalendarDays size={20} aria-hidden="true" /><h2 className="detail-section-title" id="partner-campaign-title">Itens de campanhas</h2></div>
            <p className="detail-text">Ofertas de campanhas e eventos vinculadas ao estabelecimento.</p>
            {ofertasCampanha.length ? <ul className="detail-link-list">
              {ofertasCampanha.map(oferta => {
                const item = data.itensCampanha.find(beneficio => beneficio.id === oferta.beneficio_campanha_id);
                const campanha = data.campanhas.find(entry => entry.id === item?.campanha_id);
                return <li key={oferta.id} className="detail-list-item">
                  <div>
                    {campanha ? <Link className="entity-record-link" to={`/campanhas/${campanha.id}`}>{item?.nome}<ArrowUpRight size={15} aria-hidden="true" /></Link> : <span className="entity-record-link">{item?.nome || `Item #${oferta.beneficio_campanha_id} indisponível`}</span>}
                    {campanha && <><span className="entity-row-note">{campanha.nome}</span><span className="entity-row-note">{formatDate(campanha.data_inicio)} a {formatDate(campanha.data_fim)}</span></>}
                    {item && <span className="entity-row-note">Item: <Badge status={item.status} /></span>}
                  </div>
                  <div className="entity-offer-status"><span>Vínculo</span><Badge status={oferta.status} /></div>
                </li>;
              })}
            </ul> : <EmptyState title="Nenhum item de campanha vinculado" description="Os itens aparecem aqui após o vínculo do conveniado a uma campanha." />}
          </section>
        </div>
        <section id="partner-history" className="entity-anchor-section" aria-label="Histórico do estabelecimento">
          <UsageHistory usages={usos} title="Utilizações neste conveniado" />
        </section>
        <p className="entity-period-note">Indicadores calculados sobre todo o histórico carregado deste conveniado, reunindo benefícios comuns e itens de campanhas. Valores reprovados e estornados não integram o valor aplicado.</p>
      </div>
    </div>
  </>;
}
