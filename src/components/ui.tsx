import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X, Inbox } from "lucide-react";
import { statusLabel } from "../models/selectors";
export function PageHeader({
  title,
  description,
  eyebrow = "PORTAL DE GESTÃO",
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </header>
  );
}
export function StatCard({
  label,
  value,
  icon,
  detail,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  detail?: ReactNode;
  tone?: "blue" | "green" | "purple" | "amber";
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-content">
        <p>{label}</p>
        <strong>{value}</strong>
        {detail && <span>{detail}</span>}
      </div>
    </article>
  );
}
export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {label ?? statusLabel(status)}
    </span>
  );
}
export type Column<T> = {
  key: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
};
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render(row)}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title="Nenhum resultado encontrado"
                  description="Tente ajustar a busca ou os filtros."
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: count }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === count || Math.abs(p - page) <= 1,
  );
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros`
          : "0 registros"}
      </span>
      <nav aria-label="Paginação">
        <button
          type="button"
          className="page-button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) => (
          <span key={p}>
            {i > 0 && p - pages[i - 1] > 1 && (
              <span className="page-dots">…</span>
            )}
            <button
              type="button"
              className={`page-button ${p === page ? "selected" : ""}`}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Página ${p}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          type="button"
          className="page-button"
          aria-label="Próxima página"
          disabled={page >= count}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
  error,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className="form-error">{error}</small>}
    </label>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Buscar registros...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-field">
      <Search size={18} aria-hidden="true" />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
    </label>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide,
  description,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  description?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Fechar janela"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function DetailList({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="detail-list">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`}>
          <dt>{item.label}</dt>
          <dd>{item.value ?? "Não informado"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={30} strokeWidth={1.5} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
