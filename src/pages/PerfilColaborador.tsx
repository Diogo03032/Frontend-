import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, ClipboardCheck, Gift, Pencil, Wallet } from "lucide-react";
import { Badge, DetailList, EmptyState, PageHeader, StatCard } from "../components/ui";
import { DetailBreadcrumb, DetailNotFound, UsageChart, UsageHistory } from "../components/DetailWidgets";
import { colaboradorNome, formatDate, formatMoney, initials } from "../models/selectors";
import { usePortal } from "../viewmodels/PortalContext";
import "../styles/entity-details.css";

export default function PerfilColaborador() {
  const { id = "" } = useParams();
  const { data } = usePortal();
  const recordId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : undefined;
  const colaborador = data.colaboradores.find(item => item.id === recordId);

  if (!colaborador) return <DetailNotFound title="Colaborador não encontrado" backTo="/colaboradores" backLabel="Voltar aos colaboradores" />;

  const usuario = data.usuarios.find(item => item.id === colaborador.usuario_id);
  const nome = colaboradorNome(data, colaborador.id);
  const usos = data.utilizacoes.filter(item => item.colaborador_id === colaborador.id);
  const aprovados = usos.filter(item => item.status === "APROVADA");
  const valorAplicado = aprovados.reduce((total, item) => total + Number(item.valor_aplicado || 0), 0);
  const ofertasUtilizadas = new Set(usos.map(item => item.beneficio_conveniado_id).filter(Boolean));
  const beneficios = data.beneficios.filter(item => data.ofertas.some(oferta => ofertasUtilizadas.has(oferta.id) && oferta.beneficio_id === item.id));
  const ofertasCampanhaUtilizadas = new Set(usos.map(item => item.beneficio_campanha_conveniado_id).filter(Boolean));
  const itensCampanha = data.itensCampanha.filter(item => data.ofertasCampanha.some(oferta => ofertasCampanhaUtilizadas.has(oferta.id) && oferta.beneficio_campanha_id === item.id));
  const campanhas = data.campanhas.filter(item => itensCampanha.some(beneficio => beneficio.campanha_id === item.id));

  return <>
    <DetailBreadcrumb items={[{ label: "Colaboradores", to: "/colaboradores" }, { label: nome }]} />
    <PageHeader
      eyebrow="GESTÃO DE PESSOAS"
      title="Perfil do colaborador"
      description="Dados cadastrais e histórico de benefícios do colaborador."
      actions={<>
        <Link to="/colaboradores" className="btn btn-secondary"><ArrowLeft size={16} aria-hidden="true" />Voltar</Link>
        <Link to={`/colaboradores?editar=${colaborador.id}`} className="btn btn-primary"><Pencil size={16} aria-hidden="true" />Editar cadastro</Link>
      </>}
    />
    <div className="detail-grid entity-detail-page">
      <aside className="detail-sidebar">
        <section className="panel detail-card entity-identity" aria-labelledby="collaborator-name">
          <span className="detail-avatar" aria-hidden="true">{initials(nome)}</span>
          <h2 id="collaborator-name">{nome}</h2>
          <p className="detail-subtitle">{colaborador.cargo}</p>
          <Badge status={colaborador.status} />
          <span className="entity-identity-caption">Matrícula {colaborador.matricula}</span>
        </section>
        <section className="panel detail-card" aria-labelledby="collaborator-registration">
          <h2 className="detail-section-title" id="collaborator-registration">Dados cadastrais</h2>
          <DetailList items={[
            { label: "Setor", value: colaborador.setor },
            { label: "Cargo", value: colaborador.cargo },
            { label: "Admissão", value: formatDate(colaborador.data_admissao) },
            { label: "Telefone", value: colaborador.telefone || "Não informado" },
            { label: "E-mail", value: usuario?.email || "Conta não disponível" },
            { label: "Status da conta", value: usuario ? <Badge status={usuario.status} /> : "Conta não disponível" },
          ]} />
        </section>
        <div className="entity-information"><BadgeCheck size={18} aria-hidden="true" /><p>Os vínculos abaixo correspondem a utilizações registradas. Limites e elegibilidade dependem das regras de cada benefício.</p></div>
      </aside>
      <div className="detail-main">
        <div className="detail-stats stats-grid">
          <StatCard label="Utilizações aprovadas" value={aprovados.length} detail={`${usos.length} solicitações no histórico`} icon={<ClipboardCheck size={21} aria-hidden="true" />} tone="green" />
          <StatCard label="Valor aplicado" value={formatMoney(valorAplicado)} detail="Somente utilizações aprovadas" icon={<Wallet size={21} aria-hidden="true" />} />
          <StatCard label="Solicitações pendentes" value={usos.filter(item => item.status === "PENDENTE").length} detail="Aguardando validação" icon={<CalendarDays size={21} aria-hidden="true" />} tone="amber" />
        </div>
        <nav className="detail-tabs" aria-label="Seções do perfil do colaborador">
          <a href="#collaborator-history">Histórico de utilizações</a>
          <a href="#collaborator-benefits">Benefícios e campanhas</a>
        </nav>
        <UsageChart usages={usos} />
        <section id="collaborator-history" className="entity-anchor-section" aria-label="Histórico do colaborador">
          <UsageHistory usages={usos} title="Histórico do colaborador" />
        </section>
        <section id="collaborator-benefits" className="detail-two-columns entity-anchor-section" aria-label="Benefícios e campanhas utilizados">
          <div className="panel detail-card">
            <div className="detail-heading"><Gift size={20} aria-hidden="true" /><h2 className="detail-section-title">Benefícios no histórico</h2></div>
            <p className="detail-text">Benefícios comuns com solicitações registradas, considerando todos os status.</p>
            {beneficios.length ? <ul className="detail-link-list">
              {beneficios.map(beneficio => <li key={beneficio.id} className="detail-list-item">
                <div><Link className="entity-record-link" to={`/beneficios/${beneficio.id}`}>{beneficio.nome}<ArrowUpRight size={15} aria-hidden="true" /></Link><span className="entity-row-note">{beneficio.tipo_beneficio === "PERCENTUAL" ? `${Number(beneficio.valor)}% de desconto` : formatMoney(beneficio.valor)}</span></div>
                <Badge status={beneficio.status} />
              </li>)}
            </ul> : <EmptyState title="Nenhum benefício comum utilizado" description="Os benefícios aparecem aqui quando houver uma solicitação vinculada." />}
          </div>
          <div className="panel detail-card">
            <div className="detail-heading"><CalendarDays size={20} aria-hidden="true" /><h2 className="detail-section-title">Campanhas no histórico</h2></div>
            <p className="detail-text">Campanhas com solicitações vinculadas aos seus itens, em todos os status.</p>
            {campanhas.length ? <ul className="detail-link-list">
              {campanhas.map(campanha => <li key={campanha.id} className="detail-list-item">
                <div><Link className="entity-record-link" to={`/campanhas/${campanha.id}`}>{campanha.nome}<ArrowUpRight size={15} aria-hidden="true" /></Link><span className="entity-row-note">{formatDate(campanha.data_inicio)} a {formatDate(campanha.data_fim)}</span></div>
                <Badge status={campanha.status} />
              </li>)}
            </ul> : <EmptyState title="Nenhuma campanha utilizada" description="As campanhas aparecem após uma solicitação de um dos seus itens." />}
          </div>
        </section>
        <p className="entity-period-note">Indicadores calculados sobre todo o histórico carregado deste colaborador. Utilizações reprovadas e estornadas não integram o valor aplicado.</p>
      </div>
    </div>
  </>;
}
