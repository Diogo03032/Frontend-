import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Megaphone, Plus } from "lucide-react";
import { usePortal } from "../viewmodels/PortalContext";
import { formatDate, statusLabel } from "../models/selectors";
import { calendarDateKey, calendarMonthDays, campaignsForDay, campaignsInMonth, filterCalendarCampaigns, parseCalendarDate, shiftCalendarMonth } from "../models/operationsSelectors";
import { Badge, EmptyState, Field, PageHeader, StatCard } from "../components/ui";
import "../styles/operations.css";

const TYPES = ["CAMPANHA", "EVENTO_INTERNO", "EVENTO_PATROCINADO", "VOUCHER", "CORTESIA"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendario() {
  const { data } = usePortal();
  const today = calendarDateKey(new Date());
  const [month, setMonth] = useState(() => shiftCalendarMonth(new Date(), 0));
  const [selectedDay, setSelectedDay] = useState(today);
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const filtered = useMemo(() => filterCalendarCampaigns(data.campanhas, tipo, status), [data.campanhas, tipo, status]);
  const monthCampaigns = useMemo(() => campaignsInMonth(filtered, month), [filtered, month]);
  const days = useMemo(() => calendarMonthDays(month), [month]);
  const selected = campaignsForDay(filtered, selectedDay);
  const monthTitle = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedDate = parseCalendarDate(selectedDay)!;
  const selectedLabel = selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" });

  function navigateMonth(delta: number) {
    const next = shiftCalendarMonth(month, delta);
    setMonth(next);
    setSelectedDay(calendarDateKey(next));
  }
  function selectDay(day: string) {
    setSelectedDay(day);
    const date = parseCalendarDate(day)!;
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(shiftCalendarMonth(date, 0));
  }
  function goToday() {
    setMonth(shiftCalendarMonth(new Date(), 0));
    setSelectedDay(today);
  }

  return <>
    <PageHeader eyebrow="PLANEJAMENTO" title="Calendário" description="Visualize a vigência das campanhas e dos eventos em uma agenda única." actions={<Link className="btn btn-primary" to="/campanhas?novo=1"><Plus size={18} /> Nova campanha ou evento</Link>} />
    <div className="stats-grid operations-stats">
      <StatCard label="Iniciativas no mês" value={monthCampaigns.length} icon={<CalendarDays />} detail="Com período sobreposto ao mês exibido" />
      <StatCard label="Ativas no mês" value={monthCampaigns.filter(item => item.status === "ATIVA").length} icon={<Megaphone />} tone="green" detail="Conforme o status cadastrado" />
      <StatCard label="Próximos inícios" value={monthCampaigns.filter(item => ["ATIVA", "PLANEJADA"].includes(item.status) && item.data_inicio.slice(0, 10) > today).length} icon={<Clock3 />} tone="purple" detail="Iniciativas do mês que ainda vão começar" />
    </div>
    <div className="calendar-layout">
      <section className="panel calendar-panel" aria-labelledby="calendar-month-title">
        <div className="panel-header calendar-toolbar">
          <div><p className="eyebrow">AGENDA DA FUNDAÇÃO</p><h2 id="calendar-month-title" className="calendar-month-title" aria-live="polite">{monthTitle}</h2></div>
          <div className="calendar-navigation"><button className="btn btn-secondary btn-small" onClick={goToday}>Hoje</button><button className="icon-button" aria-label="Mês anterior" onClick={() => navigateMonth(-1)}><ChevronLeft size={20} /></button><button className="icon-button" aria-label="Próximo mês" onClick={() => navigateMonth(1)}><ChevronRight size={20} /></button></div>
        </div>
        <div className="filters calendar-filters">
          <Field label="Tipo de iniciativa"><select value={tipo} onChange={event => setTipo(event.target.value)}><option value="">Todos os tipos</option>{TYPES.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></Field>
          <Field label="Status da iniciativa"><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option>{["PLANEJADA", "ATIVA", "ENCERRADA", "CANCELADA"].map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></Field>
        </div>
        <div className="calendar-grid" role="group" aria-label={`Calendário de ${monthTitle}`}>
          {WEEKDAYS.map(day => <span className="calendar-weekday" key={day}>{day}</span>)}
          {days.map(day => {
            const items = campaignsForDay(filtered, day.date);
            const date = parseCalendarDate(day.date)!;
            return <button key={day.date} type="button" className={`calendar-day ${!day.inMonth ? "calendar-day-outside" : ""} ${day.date === today ? "calendar-day-today" : ""} ${day.date === selectedDay ? "calendar-day-selected" : ""}`} aria-label={`${date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}${day.date === today ? ", hoje" : ""}, ${items.length} ${items.length === 1 ? "iniciativa" : "iniciativas"}`} aria-pressed={day.date === selectedDay} aria-current={day.date === today ? "date" : undefined} onClick={() => selectDay(day.date)}>
              <span className="calendar-day-number">{day.day}</span>
              <span className="calendar-day-items" aria-hidden="true">{items.slice(0, 2).map(item => <span className={`calendar-chip calendar-chip-${item.status.toLowerCase()}`} key={item.id}>{item.nome}</span>)}{items.length > 2 && <span className="calendar-more">+{items.length - 2} iniciativas</span>}</span>
              {items.length > 0 && <span className="calendar-mobile-count" aria-hidden="true">{items.length}</span>}
            </button>;
          })}
        </div>
        <div className="calendar-legend"><span><i className="calendar-dot calendar-dot-active" /> Ativa</span><span><i className="calendar-dot calendar-dot-planned" /> Planejada</span><span><i className="calendar-dot calendar-dot-ended" /> Encerrada / cancelada</span></div>
        {!monthCampaigns.length && <p className="calendar-month-empty" role="status">Nenhuma iniciativa neste mês com os filtros selecionados.</p>}
      </section>
      <section className="panel calendar-agenda" aria-labelledby="calendar-agenda-title">
        <div className="panel-header"><div><p className="eyebrow">DIA SELECIONADO</p><h2 id="calendar-agenda-title">{selectedLabel}</h2></div><span className="calendar-agenda-count">{selected.length}</span></div>
        {selected.length ? <div className="calendar-agenda-list">{selected.map(item => <article className="calendar-agenda-item" key={item.id}>
          <div className="calendar-agenda-top"><span className="calendar-item-type">{statusLabel(item.tipo)}</span><Badge status={item.status} /></div>
          <h3><Link to={`/campanhas/${item.id}`}>{item.nome}</Link></h3>
          {item.descricao && <p className="calendar-agenda-description">{item.descricao}</p>}
          <p className="calendar-period"><CalendarDays size={16} /><span>{formatDate(item.data_inicio.slice(0, 10))} a {formatDate(item.data_fim.slice(0, 10))}</span></p>
          <Link className="calendar-detail-link" to={`/campanhas/${item.id}`}>Ver detalhes <ArrowRight size={16} /></Link>
        </article>)}</div> : <EmptyState title="Dia livre na agenda" description="Não há campanhas ou eventos vigentes nesta data com os filtros selecionados." />}
        <p className="calendar-agenda-note">As iniciativas aparecem em todos os dias do período cadastrado. Consulte os detalhes para conferir as regras de participação.</p>
        <Link className="btn btn-secondary calendar-list-link" to="/campanhas">Gerenciar campanhas e eventos <ArrowRight size={16} /></Link>
      </section>
    </div>
  </>;
}
