import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { usePortal } from "../viewmodels/PortalContext";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  formatDate,
} from "../models/selectors";
import { Modal } from "./ui";

const MAX_VISIBLE = 8;

export default function NotificationCenter() {
  const { data, loading, error, reload } = usePortal();
  const [open, setOpen] = useState(false);
  const countId = useId();
  const pending = useMemo(
    () => data.utilizacoes
      .filter(item => item.status === "PENDENTE")
      .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao) || b.id - a.id),
    [data.utilizacoes],
  );
  const ready = !loading && !error;
  const countLabel = `${pending.length} ${pending.length === 1 ? "utilização pendente" : "utilizações pendentes"}`;

  return <>
    <button
      type="button"
      className="notification-trigger"
      aria-label="Abrir notificações"
      aria-describedby={countId}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
    >
      <Bell size={22} aria-hidden="true" />
      {ready && pending.length > 0 && <span className="notification-count" aria-hidden="true">{pending.length > 99 ? "99+" : pending.length}</span>}
    </button>
    <span id={countId} className="sr-only">{loading ? "Carregando notificações" : error ? "Notificações indisponíveis" : countLabel}</span>

    {open && <Modal title="Notificações" description="Acompanhe as utilizações que aguardam validação." onClose={() => setOpen(false)}>
      <div className="notifications-toolbar">
        <span>{ready ? countLabel : "Utilizações pendentes"}</span>
        <button type="button" className="btn btn-secondary btn-small" aria-label="Atualizar notificações" onClick={() => void reload()} disabled={loading}>
          <RefreshCw size={15} aria-hidden="true" />Atualizar
        </button>
      </div>

      {loading ? <div className="notifications-state" role="status"><span className="spinner" /><p>Carregando notificações…</p></div>
        : error ? <div className="notifications-state" role="alert"><p>Não foi possível consultar as notificações.</p><p className="text-muted">{error}</p></div>
        : pending.length ? <>
          <ul className="notifications-list">
            {pending.slice(0, MAX_VISIBLE).map(item => {
              const benefit = beneficioDaUtilizacao(data, item);
              const partner = conveniadoDaUtilizacao(data, item);
              const reference = `#${String(item.id).padStart(5, "0")}`;
              return <li key={item.id}>
                <Link className="notification-item" to={`/utilizacoes?status=PENDENTE&utilizacao=${item.id}`} aria-label={`Ver utilização ${reference}`} onClick={() => setOpen(false)}>
                  <span className="notification-item-icon"><ClipboardList size={20} aria-hidden="true" /></span>
                  <div className="notification-copy">
                    <span className="notification-label">Utilização pendente <span>{reference}</span></span>
                    <strong>{benefit?.nome ?? "Benefício não encontrado"}</strong>
                    <p>{colaboradorNome(data, item.colaborador_id)} · {partner?.nome_fantasia ?? "Conveniado não encontrado"}</p>
                    <time dateTime={item.data_solicitacao}>{formatDate(item.data_solicitacao, true)}</time>
                  </div>
                  <ChevronRight size={18} className="notification-chevron" aria-hidden="true" />
                </Link>
              </li>;
            })}
          </ul>
          {pending.length > MAX_VISIBLE && <p className="notifications-limit">Exibindo as {MAX_VISIBLE} pendências mais recentes.</p>}
        </> : <div className="notifications-state notifications-empty"><CheckCircle2 size={38} aria-hidden="true" /><h3>Tudo em dia</h3><p>Não há utilizações pendentes no momento.</p></div>}

      <div className="modal-footer notifications-footer">
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Fechar</button>
        {ready && pending.length > 0 && <Link className="btn btn-primary" to="/utilizacoes?status=PENDENTE" onClick={() => setOpen(false)}>Ver todas as pendentes<ChevronRight size={16} aria-hidden="true" /></Link>}
      </div>
    </Modal>}
  </>;
}
