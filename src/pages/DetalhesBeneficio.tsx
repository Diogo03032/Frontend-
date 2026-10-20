import { Link, useParams } from "react-router-dom";
import { Building2, CheckCircle2, Gift, Link2, Pencil, Wallet } from "lucide-react";
import { Badge, DetailList, EmptyState, PageHeader, StatCard } from "../components/ui";
import { DetailBreadcrumb, DetailNotFound, UsageChart, UsageHistory } from "../components/DetailWidgets";
import { formatDate, formatMoney, statusLabel } from "../models/selectors";
import { usePortal } from "../viewmodels/PortalContext";

export default function DetalhesBeneficio() {
  const { id } = useParams();
  const { data, loading, error, reload } = usePortal();
  const validId = !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const benefit = validId ? data.beneficios.find((item) => item.id === Number(id)) : undefined;

  if (loading && validId && !benefit)
    return <EmptyState title="Carregando benefício…" description="Consultando as informações do catálogo." />;
  if (error && validId && !benefit)
    return <EmptyState title="Não foi possível carregar o benefício" description={error} action={<button className="btn btn-primary" onClick={() => void reload()}>Tentar novamente</button>} />;
  if (!benefit)
    return <DetailNotFound title="Benefício não encontrado" backTo="/beneficios" backLabel="Voltar aos benefícios" />;

  const offers = data.ofertas.filter((offer) => offer.beneficio_id === benefit.id);
  const offerIds = new Set(offers.map((offer) => offer.id));
  const usages = data.utilizacoes.filter((usage) => usage.beneficio_conveniado_id != null && offerIds.has(usage.beneficio_conveniado_id));
  const approved = usages.filter((usage) => usage.status === "APROVADA");
  const appliedValue = approved.reduce((total, usage) => total + Number(usage.valor_aplicado || 0), 0);
  const activePartners = new Set(offers.filter((offer) => offer.status === "ATIVO" && data.conveniados.some((partner) => partner.id === offer.conveniado_id && partner.status === "ATIVO")).map((offer) => offer.conveniado_id)).size;
  const fixed = benefit.tipo_janela === "CALENDARIO_FIXO";
  const value = benefit.tipo_beneficio === "PERCENTUAL" ? `${Number(benefit.valor).toLocaleString("pt-BR")}%` : formatMoney(benefit.valor);
  const cycleLabel = benefit.unidade_ciclo === "ANO" ? "Anual" : benefit.unidade_ciclo === "SEMANA" ? "Semanal" : benefit.unidade_ciclo === "MES" ? "Mensal" : "Não informado";
  const interval = benefit.intervalo_valor;
  const intervalUnit = benefit.intervalo_unidade === "MES" ? interval === 1 ? "mês" : "meses" : benefit.intervalo_unidade === "DIA" ? interval === 1 ? "dia" : "dias" : "";
  const cycle = fixed ? cycleLabel : interval != null && intervalUnit ? `A cada ${interval} ${intervalUnit}` : "Não informado";
  const reference = benefit.referencia_contagem === "ULTIMA_UTILIZACAO" ? "Última utilização" : benefit.referencia_contagem === "DATA_ADMISSAO_COLABORADOR" ? "Admissão do colaborador" : "Não informada";

  return (
    <>
      <DetailBreadcrumb items={[{ label: "Benefícios", to: "/beneficios" }, { label: benefit.nome }]} />
      <PageHeader eyebrow="CATÁLOGO DE BENEFÍCIOS" title={benefit.nome} description="Condições, conveniados e histórico deste benefício." actions={<>
        <Link className="btn btn-secondary" to={`/beneficios?ofertas=${benefit.id}`}><Link2 size={17} /> Gerenciar conveniados</Link>
        <Link className="btn btn-primary" to={`/beneficios?editar=${benefit.id}`}><Pencil size={17} /> Editar benefício</Link>
      </>} />
      <section className="detail-hero" aria-label="Resumo do benefício">
        <div className="detail-heading">
          <span className="detail-avatar" aria-hidden="true"><Gift size={28} /></span>
          <div><span className="eyebrow">{benefit.tipo_beneficio === "PERCENTUAL" ? "DESCONTO PERCENTUAL" : "BENEFÍCIO DE VALOR FIXO"}</span><h2>{value}</h2><p className="detail-subtitle">{benefit.quantidade_maxima_utilizacoes} {benefit.quantidade_maxima_utilizacoes === 1 ? "utilização permitida" : "utilizações permitidas"} por ciclo · {cycle}</p></div>
          <Badge status={benefit.status} />
        </div>
        <p className="detail-text">{benefit.descricao?.trim() || "Este benefício ainda não possui uma descrição cadastrada."}</p>
      </section>
      <div className="stats-grid detail-stats">
        <StatCard label="Utilizações aprovadas" value={approved.length} detail={`${usages.length} solicitações no histórico`} icon={<CheckCircle2 size={21} />} tone="green" />
        <StatCard label="Valor aplicado" value={formatMoney(appliedValue)} detail="Somente utilizações aprovadas" icon={<Wallet size={21} />} />
        <StatCard label="Conveniados com oferta ativa" value={activePartners} detail="Oferta e conveniado com status ativo" icon={<Building2 size={21} />} tone="purple" />
      </div>
      <div className="detail-grid">
        <aside className="detail-sidebar">
          <section className="panel detail-card">
            <h2 className="detail-section-title">Regras do benefício</h2>
            <DetailList items={[
              { label: "Código", value: `#${benefit.id}` },
              { label: "Tipo", value: benefit.tipo_beneficio === "PERCENTUAL" ? "Desconto percentual" : "Valor fixo" },
              { label: "Valor cadastrado", value },
              { label: "Limite por ciclo", value: `${benefit.quantidade_maxima_utilizacoes} ${benefit.quantidade_maxima_utilizacoes === 1 ? "utilização" : "utilizações"}` },
              { label: "Tipo de renovação", value: fixed ? "Calendário fixo" : "Janela móvel" },
              { label: "Ciclo", value: cycle },
              ...(fixed ? [{ label: "Data de referência do ciclo", value: formatDate(benefit.dia_reset) }] : [{ label: "Referência da contagem", value: reference }]),
            ]} />
          </section>
        </aside>
        <div className="detail-main">
          <section className="panel detail-card" aria-labelledby="benefit-partners-title">
            <div className="detail-heading"><h2 className="detail-section-title" id="benefit-partners-title">Conveniados vinculados</h2><span className="detail-subtitle">{offers.length} {offers.length === 1 ? "oferta" : "ofertas"}</span></div>
            {offers.length ? <div className="detail-link-list">{offers.map((offer) => {
              const partner = data.conveniados.find((item) => item.id === offer.conveniado_id);
              return <article className="detail-list-item" key={offer.id}>
                <div>{partner ? <Link className="button-link" to={`/conveniados/${partner.id}`}>{partner.nome_fantasia || partner.razao_social}</Link> : <strong>Conveniado #{offer.conveniado_id}</strong>}<p className="detail-subtitle">{partner?.categoria || "Categoria não informada"} · Oferta #{offer.id}</p></div>
                <div className="table-actions"><Badge status={offer.status} label={`Oferta ${offer.status === "ATIVO" ? "ativa" : "inativa"}`} />{partner && <Badge status={partner.status} label={`Conveniado ${statusLabel(partner.status).toLocaleLowerCase("pt-BR")}`} />}</div>
              </article>;
            })}</div> : <EmptyState title="Nenhum conveniado vinculado" description="Vincule um conveniado para disponibilizar uma oferta deste benefício." action={<Link className="btn btn-secondary" to={`/beneficios?ofertas=${benefit.id}`}><Link2 size={17} /> Gerenciar conveniados</Link>} />}
          </section>
          <UsageChart usages={usages} />
        </div>
      </div>
      <UsageHistory usages={usages} title="Histórico do benefício" />
    </>
  );
}
