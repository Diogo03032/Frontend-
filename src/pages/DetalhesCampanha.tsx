import { Link, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Gift, Link2, Pencil, Users } from "lucide-react";
import { Badge, DetailList, EmptyState, PageHeader, StatCard } from "../components/ui";
import { DetailBreadcrumb, DetailNotFound, UsageChart, UsageHistory } from "../components/DetailWidgets";
import { formatDate, formatMoney, statusLabel } from "../models/selectors";
import { usePortal } from "../viewmodels/PortalContext";

export default function DetalhesCampanha() {
  const { id } = useParams();
  const { data, loading, error, reload } = usePortal();
  const validId = !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const campaign = validId ? data.campanhas.find((item) => item.id === Number(id)) : undefined;

  if (loading && validId && !campaign)
    return <EmptyState title="Carregando iniciativa…" description="Consultando as informações da campanha ou evento." />;
  if (error && validId && !campaign)
    return <EmptyState title="Não foi possível carregar a iniciativa" description={error} action={<button className="btn btn-primary" onClick={() => void reload()}>Tentar novamente</button>} />;
  if (!campaign)
    return <DetailNotFound title="Campanha ou evento não encontrado" backTo="/campanhas" backLabel="Voltar às campanhas" />;

  const items = data.itensCampanha.filter((item) => item.campanha_id === campaign.id);
  const itemIds = new Set(items.map((item) => item.id));
  const offers = data.ofertasCampanha.filter((offer) => itemIds.has(offer.beneficio_campanha_id));
  const offerIds = new Set(offers.map((offer) => offer.id));
  const usages = data.utilizacoes.filter((usage) => usage.beneficio_campanha_conveniado_id != null && offerIds.has(usage.beneficio_campanha_conveniado_id));
  const approved = usages.filter((usage) => usage.status === "APROVADA");
  const participants = new Set(approved.map((usage) => usage.colaborador_id)).size;
  const appliedValue = approved.reduce((total, usage) => total + Number(usage.valor_aplicado || 0), 0);
  const activePartners = new Set(offers.filter((offer) => offer.status === "ATIVO" && items.some((item) => item.id === offer.beneficio_campanha_id && item.status === "ATIVO") && data.conveniados.some((partner) => partner.id === offer.conveniado_id && partner.status === "ATIVO")).map((offer) => offer.conveniado_id)).size;

  return (
    <>
      <DetailBreadcrumb items={[{ label: "Campanhas e eventos", to: "/campanhas" }, { label: campaign.nome }]} />
      <PageHeader eyebrow="CAMPANHAS E EVENTOS" title={campaign.nome} description="Acompanhe os itens promocionais e as utilizações registradas nesta iniciativa." actions={<>
        <Link className="btn btn-secondary" to={`/campanhas?itens=${campaign.id}`}><Link2 size={17} /> Gerenciar itens</Link>
        <Link className="btn btn-primary" to={`/campanhas?editar=${campaign.id}`}><Pencil size={17} /> Editar iniciativa</Link>
      </>} />
      <section className="detail-hero" aria-label="Resumo da iniciativa">
        <div className="detail-heading"><span className="detail-avatar" aria-hidden="true"><CalendarDays size={28} /></span><div><span className="eyebrow">{statusLabel(campaign.tipo)}</span><h2>{formatDate(campaign.data_inicio)} a {formatDate(campaign.data_fim)}</h2><p className="detail-subtitle">Período cadastrado da iniciativa</p></div><Badge status={campaign.status} /></div>
        <p className="detail-text">{campaign.descricao?.trim() || "Esta iniciativa ainda não possui uma descrição cadastrada."}</p>
      </section>
      <div className="stats-grid detail-stats">
        <StatCard label="Participantes com uso aprovado" value={participants} detail="Colaboradores distintos com utilização aprovada" icon={<Users size={21} />} tone="purple" />
        <StatCard label="Utilizações aprovadas" value={approved.length} detail={`${usages.length} solicitações registradas`} icon={<CheckCircle2 size={21} />} tone="green" />
        <StatCard label="Itens promocionais" value={items.length} detail={`${items.filter((item) => item.status === "ATIVO").length} ativos · ${activePartners} conveniados com vínculo ativo`} icon={<Gift size={21} />} />
      </div>
      <div className="detail-grid">
        <aside className="detail-sidebar">
          <section className="panel detail-card">
            <h2 className="detail-section-title">Informações da iniciativa</h2>
            <DetailList items={[
              { label: "Código", value: `#${campaign.id}` },
              { label: "Tipo", value: statusLabel(campaign.tipo) },
              { label: "Início", value: formatDate(campaign.data_inicio) },
              { label: "Encerramento", value: formatDate(campaign.data_fim) },
              { label: "Patrocinador", value: campaign.patrocinador?.trim() || "Não informado" },
              { label: "Critério de elegibilidade", value: campaign.criterio_elegibilidade?.trim() || "Não informado" },
              { label: "Valor aplicado", value: formatMoney(appliedValue) },
            ]} />
            <p className="detail-subtitle">O valor considera apenas utilizações aprovadas. A participação é apurada pelos colaboradores que possuem ao menos um uso aprovado.</p>
          </section>
        </aside>
        <div className="detail-main">
          <section className="panel detail-card" aria-labelledby="campaign-items-title">
            <div className="detail-heading"><h2 className="detail-section-title" id="campaign-items-title">Itens e conveniados participantes</h2><Link className="button-link" to={`/campanhas?itens=${campaign.id}`}>Gerenciar itens</Link></div>
            {items.length ? <div className="detail-link-list">{items.map((item) => {
              const itemOffers = offers.filter((offer) => offer.beneficio_campanha_id === item.id);
              const value = item.tipo_beneficio === "PERCENTUAL" ? `${Number(item.valor).toLocaleString("pt-BR")}% de desconto` : `${formatMoney(item.valor)} em valor fixo`;
              return <article className="detail-card" key={item.id}>
                <div className="detail-heading"><div><h3>{item.nome}</h3><p className="detail-subtitle">{value} · {item.quantidade_maxima_utilizacoes == null ? "Sem limite de utilizações cadastrado" : `${item.quantidade_maxima_utilizacoes} ${item.quantidade_maxima_utilizacoes === 1 ? "utilização permitida" : "utilizações permitidas"}`}</p></div><Badge status={item.status} /></div>
                {item.descricao?.trim() && <p className="detail-text">{item.descricao}</p>}
                {itemOffers.length ? <div className="detail-link-list">{itemOffers.map((offer) => {
                  const partner = data.conveniados.find((candidate) => candidate.id === offer.conveniado_id);
                  return <div className="detail-list-item" key={offer.id}>
                    <div>{partner ? <Link className="button-link" to={`/conveniados/${partner.id}`}>{partner.nome_fantasia || partner.razao_social}</Link> : <strong>Conveniado #{offer.conveniado_id}</strong>}<p className="detail-subtitle">{partner?.categoria || "Categoria não informada"}</p></div>
                    <div className="table-actions"><Badge status={offer.status} label={`Oferta ${offer.status === "ATIVO" ? "ativa" : "inativa"}`} />{partner && <Badge status={partner.status} label={`Conveniado ${statusLabel(partner.status).toLocaleLowerCase("pt-BR")}`} />}</div>
                  </div>;
                })}</div> : <p className="detail-subtitle">Nenhum conveniado vinculado a este item.</p>}
              </article>;
            })}</div> : <EmptyState title="Nenhum item promocional cadastrado" description="Adicione os benefícios e vincule os conveniados desta campanha ou evento." action={<Link className="btn btn-secondary" to={`/campanhas?itens=${campaign.id}`}><Gift size={17} /> Gerenciar itens</Link>} />}
          </section>
          <UsageChart usages={usages} />
        </div>
      </div>
      <UsageHistory usages={usages} title="Histórico da campanha ou evento" />
    </>
  );
}
