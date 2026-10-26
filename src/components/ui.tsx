import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X, Inbox, Users, Gift, Handshake, ClipboardList, Megaphone, ChartNoAxesCombined, Settings } from "lucide-react";
import { statusLabel } from "../models/selectors";
const ValidationContext = createContext<string[]>([]);
type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
  group?: string;
};
type OptionProps = {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
};
type OptionGroupProps = {
  label?: string;
  children?: ReactNode;
};

function optionLabel(children: ReactNode) {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : "",
    )
    .join("")
    .trim();
}

function readOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  Children.toArray(children).forEach((child) => {
    if (!isValidElement<OptionProps | OptionGroupProps>(child)) return;
    if (child.type === "option") {
      const props = child.props as OptionProps;
      const label = optionLabel(props.children);
      options.push({
        value: String(props.value ?? label),
        label,
        disabled: Boolean(props.disabled),
      });
      return;
    }
    if (child.type === "optgroup") {
      const props = child.props as OptionGroupProps;
      const group = props.label ?? "";
      Children.toArray(props.children).forEach((option) => {
        if (!isValidElement<OptionProps>(option) || option.type !== "option")
          return;
        const optionProps = option.props;
        const label = optionLabel(optionProps.children);
        options.push({
          value: String(optionProps.value ?? label),
          label,
          disabled: Boolean(optionProps.disabled),
          group,
        });
      });
    }
  });
  return options;
}

function FormSelect({
  element,
  invalid,
  label,
}: {
  element: ReactElement<SelectHTMLAttributes<HTMLSelectElement>>;
  invalid: boolean;
  label: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [uncontrolledValue, setUncontrolledValue] = useState(
    String(element.props.defaultValue ?? ""),
  );
  const options = readOptions(element.props.children);
  const selectedValue = String(
    element.props.value ?? uncontrolledValue,
  );
  const selectedOption = options.find((option) => option.value === selectedValue);
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue,
  );
  const disabled = Boolean(element.props.disabled);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function chooseOption(option: SelectOption) {
    const select = wrapperRef.current?.querySelector("select");
    if (option.disabled || !select) return;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    if (!valueSetter) {
      throw new Error("Não foi possível atualizar o campo de seleção.");
    }
    valueSetter.call(select, option.value);
    if (element.props.value === undefined) {
      setUncontrolledValue(option.value);
    }
    select.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
  }

  function moveActiveIndex(direction: -1 | 1) {
    const enabledOptions = options
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);
    if (!enabledOptions.length) return;
    const position = enabledOptions.indexOf(activeIndex);
    const nextPosition =
      position < 0
        ? direction === 1
          ? 0
          : enabledOptions.length - 1
        : (position + direction + enabledOptions.length) %
          enabledOptions.length;
    setActiveIndex(enabledOptions[nextPosition]);
  }

  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        moveActiveIndex(event.key === "ArrowDown" ? 1 : -1);
      }
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const enabledOptions = options
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0);
      setActiveIndex(
        event.key === "Home"
          ? (enabledOptions[0] ?? -1)
          : (enabledOptions.at(-1) ?? -1),
      );
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        const activeOption = options[activeIndex];
        if (activeOption) chooseOption(activeOption);
      } else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const nativeSelect = cloneElement(element, {
    id: listId,
    className: `${element.props.className ?? ""} field-select-native`.trim(),
    "aria-hidden": true,
    tabIndex: -1,
  });

  return (
    <div className="field-select" ref={wrapperRef}>
      {nativeSelect}
      <button
        type="button"
        className={`field-select-trigger${invalid ? " is-invalid" : ""}`}
        role="combobox"
        aria-label={element.props["aria-label"] ?? label}
        aria-labelledby={element.props["aria-labelledby"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId + "-options"}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        aria-required={element.props.required || undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) return;
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={selectedOption ? "" : "is-placeholder"}>
          {selectedOption?.label ?? "Selecione uma opção"}
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={listId + "-options"}
          className="field-select-menu"
          role="listbox"
          aria-labelledby={element.props["aria-labelledby"]}
        >
          {options.map((option, index) => (
            <div key={`${option.group ?? ""}-${option.value}-${index}`}>
              {option.group &&
                (index === 0 || options[index - 1].group !== option.group) && (
                  <div className="field-select-group">{option.group}</div>
                )}
              <button
                id={`${listId}-option-${index}`}
                type="button"
                className={`field-select-option${
                  selectedValue === option.value ? " is-selected" : ""
                }${activeIndex === index ? " is-active" : ""}`}
                role="option"
                aria-selected={selectedValue === option.value}
                aria-disabled={option.disabled || undefined}
                disabled={option.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  chooseOption(option);
                }}
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <span className="field-select-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function invalidFields(form: HTMLFormElement) {
  form.querySelectorAll(".field").forEach((field) => {
    if (field.querySelector("em"))
      field.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea").forEach((input) => { input.required = true; });
  });
  return [...new Set([...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea")]
    .filter((input) => input.willValidate && (!input.validity.valid || (input.required && !input.value.trim()) || (input.inputMode === "numeric" && input.value.replace(/\D/g, "").length !== 14)))
    .map((input) => input.closest(".field")?.querySelector("span")?.textContent?.replace("*", "").trim() || "Campo obrigatório"))];
}
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
  const TitleIcon = title.includes("Colaboradores") ? Users : title.includes("Benefícios") ? Gift : title.includes("Conveniados") ? Handshake : title.includes("Utilizações") ? ClipboardList : title.includes("Campanhas") ? Megaphone : title.includes("Relatórios") ? ChartNoAxesCombined : title.includes("Perfis") ? Settings : null;
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{TitleIcon && <TitleIcon size={29} aria-hidden="true" />}{title}</h1>
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
  const invalid = useContext(ValidationContext).includes(label);
  const selectElement =
    isValidElement<SelectHTMLAttributes<HTMLSelectElement>>(children) &&
    children.type === "select"
      ? children
      : undefined;
  return (
    <label className={`field ${invalid ? "field-invalid" : ""}`}>
      <span>
        {label}
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {selectElement ? (
        <FormSelect element={selectElement} invalid={invalid} label={label} />
      ) : (
        children
      )}
      {hint && <small>{hint}</small>}
      {error && <small className="form-error">{error}</small>}
      {invalid && <small className="field-validation-error">Preencha ou corrija este campo.</small>}
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
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startY: 0, startScrollTop: 0 });
  const [dragging, setDragging] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const id = useId();
  const [pending, setPending] = useState<string[]>([]);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    dialog?.querySelectorAll("form").forEach((form) => { form.noValidate = true; });
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    const body = modalBodyRef.current;
    const content = modalContentRef.current;
    if (!body || !content) return;

    const updateScrollCue = () => {
      setHasMoreBelow(body.scrollTop + body.clientHeight < body.scrollHeight - 8);
    };
    updateScrollCue();
    body.addEventListener("scroll", updateScrollCue, { passive: true });
    const observer = new ResizeObserver(updateScrollCue);
    observer.observe(body);
    observer.observe(content);

    return () => {
      body.removeEventListener("scroll", updateScrollCue);
      observer.disconnect();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onSubmitCapture={(event) => {
        if (event.target instanceof HTMLFormElement) {
          const issues = invalidFields(event.target);
          setPending(issues);
          if (issues.length) { event.preventDefault(); event.stopPropagation(); }
        }
      }}
      onInputCapture={(event) => {
        if (pending.length && event.target instanceof HTMLElement) {
          const form = event.target.closest("form");
          if (form) setPending(invalidFields(form));
        }
      }}
      onChangeCapture={(event) => {
        if (pending.length && event.target instanceof HTMLElement) {
          const form = event.target.closest("form");
          if (form) setPending(invalidFields(form));
        }
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p id={`${id}-description`}>{description}</p>}
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
      <div className="modal-scroll-region">
        <div
          ref={modalBodyRef}
          className={`modal-body${dragging ? " is-dragging" : ""}`}
          onPointerDown={(event) => {
            const body = event.currentTarget;
            const target = event.target;
            if (
              event.pointerType !== "mouse" ||
              event.button !== 0 ||
              body.scrollHeight <= body.clientHeight ||
              !(target instanceof HTMLElement) ||
              target.closest("button, a, input, select, textarea, label, [contenteditable='true']")
            ) return;
            dragRef.current = {
              pointerId: event.pointerId,
              startY: event.clientY,
              startScrollTop: body.scrollTop,
            };
            body.setPointerCapture(event.pointerId);
            setDragging(true);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (event.pointerId !== dragRef.current.pointerId) return;
            event.currentTarget.scrollTop =
              dragRef.current.startScrollTop - (event.clientY - dragRef.current.startY);
            event.preventDefault();
          }}
          onPointerUp={(event) => {
            if (event.pointerId !== dragRef.current.pointerId) return;
            dragRef.current.pointerId = -1;
            setDragging(false);
          }}
          onPointerCancel={() => {
            dragRef.current.pointerId = -1;
            setDragging(false);
          }}
          onLostPointerCapture={() => {
            dragRef.current.pointerId = -1;
            setDragging(false);
          }}
        >
          <div ref={modalContentRef}>
            <ValidationContext.Provider value={pending}>
              {children}
              {pending.length > 0 && <div className="validation-summary" role="alert"><strong>Revise os campos abaixo:</strong><ul>{pending.map((field) => <li key={field}>{field}</li>)}</ul></div>}
            </ValidationContext.Provider>
          </div>
        </div>
        {hasMoreBelow && (
          <div className="modal-scroll-cue" aria-hidden="true">
            <ChevronDown size={15} />
            <span>Mais conteúdo abaixo</span>
          </div>
        )}
      </div>
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
