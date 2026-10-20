import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  Gift,
  Link2,
  Pencil,
  Plus,
  Power,
  Unlink,
} from "lucide-react";
import {
  Badge,
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  StatCard,
} from "../components/ui";
import { usePortal } from "../viewmodels/PortalContext";
import { useInitialAction } from "../viewmodels/useInitialAction";
import { conveniadoNome, formatMoney } from "../models/selectors";
import type { Beneficio } from "../models/types";

const PAGE_SIZE = 8;
type BeneficioForm = {
  nome: string;
  descricao: string;
  status: Beneficio["status"];
  tipo_beneficio: Beneficio["tipo_beneficio"];
  valor: string;
  quantidade_maxima_utilizacoes: string;
  tipo_janela: Beneficio["tipo_janela"];
  unidade_ciclo: NonNullable<Beneficio["unidade_ciclo"]>;
  dia_reset: string;
  intervalo_valor: string;
  intervalo_unidade: NonNullable<Beneficio["intervalo_unidade"]>;
  referencia_contagem: NonNullable<Beneficio["referencia_contagem"]>;
};
const blankForm = (): BeneficioForm => ({
  nome: "",
  descricao: "",
  status: "ATIVO",
  tipo_beneficio: "PERCENTUAL",
  valor: "",
  quantidade_maxima_utilizacoes: "1",
  tipo_janela: "CALENDARIO_FIXO",
  unidade_ciclo: "MES",
  dia_reset: "",
  intervalo_valor: "30",
  intervalo_unidade: "DIA",
  referencia_contagem: "ULTIMA_UTILIZACAO",
});

function ruleSummary(item: Beneficio) {
  const count = `${item.quantidade_maxima_utilizacoes} ${item.quantidade_maxima_utilizacoes === 1 ? "utilização" : "utilizações"}`;
  if (item.tipo_janela === "CALENDARIO_FIXO")
    return `${count} por ${item.unidade_ciclo === "ANO" ? "ano" : item.unidade_ciclo === "SEMANA" ? "semana" : "mês"}`;
  const unit =
    item.intervalo_unidade === "MES"
      ? item.intervalo_valor === 1
        ? "mês"
        : "meses"
      : item.intervalo_valor === 1
        ? "dia"
        : "dias";
  return `${count} a cada ${item.intervalo_valor} ${unit}`;
}
function valueSummary(item: Beneficio) {
  return item.tipo_beneficio === "PERCENTUAL"
    ? `${Number(item.valor).toLocaleString("pt-BR")}%`
    : formatMoney(Number(item.valor));
}

export default function Beneficios() {
  const { data, save, notify, loading } = usePortal();
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("buscar") ?? "");
  const [status, setStatus] = useState("");
  const [windowType, setWindowType] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Beneficio>();
  const [discontinuing, setDiscontinuing] = useState<Beneficio>();
  const [linking, setLinking] = useState<Beneficio>();
  const [selectedPartner, setSelectedPartner] = useState("");
  const [form, setForm] = useState<BeneficioForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const filtered = data.beneficios.filter(
    (item) =>
      (!status || item.status === status) &&
      (!windowType || item.tipo_janela === windowType) &&
      `${item.nome} ${item.descricao ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );
  const visibleRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const activeOffers = (id: number) =>
    data.ofertas.filter(
      (item) => item.beneficio_id === id && item.status === "ATIVO",
    );
  const linkedOffers = linking
    ? data.ofertas.filter((item) => item.beneficio_id === linking.id)
    : [];
  const availablePartners = data.conveniados.filter(
    (partner) =>
      partner.status === "ATIVO" &&
      !linkedOffers.some(
        (item) => item.conveniado_id === partner.id && item.status === "ATIVO",
      ),
  );

  function openForm(item?: Beneficio) {
    setEditing(item);
    setForm(
      item
        ? {
            nome: item.nome,
            descricao: item.descricao ?? "",
            status: item.status,
            tipo_beneficio: item.tipo_beneficio,
            valor: String(item.valor),
            quantidade_maxima_utilizacoes: String(
              item.quantidade_maxima_utilizacoes,
            ),
            tipo_janela: item.tipo_janela,
            unidade_ciclo: item.unidade_ciclo ?? "MES",
            dia_reset: item.dia_reset?.slice(0, 10) ?? "",
            intervalo_valor: String(item.intervalo_valor ?? 30),
            intervalo_unidade: item.intervalo_unidade ?? "DIA",
            referencia_contagem:
              item.referencia_contagem ?? "ULTIMA_UTILIZACAO",
          }
        : blankForm(),
    );
    setFormError("");
    setFormOpen(true);
  }

  useInitialAction({
    editar: id => {
      const item = data.beneficios.find(entry => entry.id === id);
      if (item) openForm(item);
    },
    ofertas: id => {
      const item = data.beneficios.find(entry => entry.id === id);
      if (item) setLinking(item);
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const value = Number(form.valor);
    const count = Number(form.quantidade_maxima_utilizacoes);
    const interval = Number(form.intervalo_valor);
    if (!form.nome.trim()) {
      setFormError("Informe o nome do benefício.");
      return;
    }
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      (form.tipo_beneficio === "PERCENTUAL" && value > 100)
    ) {
      setFormError(
        "Informe um valor maior que zero. O desconto percentual deve ser de até 100%.",
      );
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      setFormError(
        "O limite de utilizações deve ser um número inteiro maior que zero.",
      );
      return;
    }
    if (
      form.tipo_janela === "JANELA_MOVEL" &&
      (!Number.isInteger(interval) || interval < 1)
    ) {
      setFormError(
        "O intervalo de renovação deve ser um número inteiro maior que zero.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const fixed = form.tipo_janela === "CALENDARIO_FIXO";
      await save("beneficios", editing?.id, {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        status: form.status,
        tipo_beneficio: form.tipo_beneficio,
        valor: value,
        quantidade_maxima_utilizacoes: count,
        tipo_janela: form.tipo_janela,
        unidade_ciclo: fixed ? form.unidade_ciclo : null,
        dia_reset: fixed && form.dia_reset ? form.dia_reset : null,
        intervalo_valor: fixed ? null : interval,
        intervalo_unidade: fixed ? null : form.intervalo_unidade,
        referencia_contagem: fixed ? null : form.referencia_contagem,
      });
      notify(
        editing
          ? "Benefício atualizado."
          : "Benefício cadastrado. Vincule os conveniados para disponibilizar as ofertas.",
      );
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o benefício.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function discontinue() {
    if (!discontinuing) return;
    setSubmitting(true);
    try {
      await save("beneficios", discontinuing.id, { status: "DESCONTINUADO" });
      notify(
        "Benefício descontinuado. As ofertas e o histórico foram preservados.",
      );
      setDiscontinuing(undefined);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível descontinuar.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function linkPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linking || !selectedPartner) return;
    setSubmitting(true);
    setFormError("");
    try {
      const existing = linkedOffers.find(
        (item) => item.conveniado_id === Number(selectedPartner),
      );
      await save("ofertas", existing?.id, {
        beneficio_id: linking.id,
        conveniado_id: Number(selectedPartner),
        status: "ATIVO",
      });
      notify(
        existing
          ? "Oferta reativada para o conveniado."
          : "Conveniado vinculado ao benefício.",
      );
      setSelectedPartner("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível vincular o conveniado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeOffer(id: number, nextStatus: "ATIVO" | "INATIVO") {
    setSubmitting(true);
    setFormError("");
    try {
      await save("ofertas", id, { status: nextStatus });
      notify(
        nextStatus === "ATIVO"
          ? "Oferta reativada."
          : "Conveniado desvinculado. O histórico da oferta foi preservado.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a oferta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="CATÁLOGO DE BENEFÍCIOS"
        title="Benefícios"
        description="Configure as condições, a renovação e os conveniados de cada benefício."
        actions={
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => openForm()}
          >
            <Plus size={18} /> Cadastrar benefício
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total de benefícios"
          value={data.beneficios.length}
          icon={<Gift size={21} />}
          detail="Benefícios no catálogo"
        />
        <StatCard
          label="Benefícios ativos"
          value={
            data.beneficios.filter((item) => item.status === "ATIVO").length
          }
          icon={<CheckCircle2 size={21} />}
          tone="green"
          detail="Disponíveis conforme as regras"
        />
        <StatCard
          label="Calendário fixo"
          value={
            data.beneficios.filter(
              (item) => item.tipo_janela === "CALENDARIO_FIXO",
            ).length
          }
          icon={<CalendarDays size={21} />}
          tone="purple"
          detail="Renovação por semana, mês ou ano"
        />
        <StatCard
          label="Ofertas ativas"
          value={data.ofertas.filter((item) => item.status === "ATIVO").length}
          icon={<Building2 size={21} />}
          tone="amber"
          detail="Vínculos com conveniados"
        />
      </div>
      <section className="panel" aria-label="Lista de benefícios">
        <div className="filters">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou descrição do benefício..."
          />
          <select
            aria-label="Filtrar benefícios por status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
            <option value="DESCONTINUADO">Descontinuados</option>
          </select>
          <select
            aria-label="Filtrar por tipo de renovação"
            value={windowType}
            onChange={(event) => {
              setWindowType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as renovações</option>
            <option value="CALENDARIO_FIXO">Calendário fixo</option>
            <option value="JANELA_MOVEL">Janela móvel</option>
          </select>
        </div>
        {filtered.length ? (
          <DataTable
            rows={visibleRows}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "nome",
                label: "Benefício",
                render: (item) => (
                  <div>
                    <div className="cell-title"><Link className="detail-record-link" to={`/beneficios/${item.id}`}>{item.nome}</Link></div>
                    <div className="cell-subtitle">
                      {item.tipo_beneficio === "PERCENTUAL"
                        ? "Desconto percentual"
                        : "Valor fixo"}
                    </div>
                  </div>
                ),
              },
              {
                key: "valor",
                label: "Condição",
                render: (item) => (
                  <span className="cell-title">{valueSummary(item)}</span>
                ),
              },
              {
                key: "renovacao",
                label: "Limite e renovação",
                render: (item) => (
                  <div>
                    <div>{ruleSummary(item)}</div>
                    <div className="cell-subtitle">
                      {item.tipo_janela === "CALENDARIO_FIXO"
                        ? "Calendário fixo"
                        : "Janela móvel"}
                    </div>
                  </div>
                ),
              },
              {
                key: "conveniados",
                label: "Conveniados",
                render: (item) => (
                  <button
                    className="button-link"
                    onClick={() => {
                      setLinking(item);
                      setSelectedPartner("");
                      setFormError("");
                    }}
                  >
                    {activeOffers(item.id).length}{" "}
                    {activeOffers(item.id).length === 1
                      ? "vinculado"
                      : "vinculados"}
                  </button>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (item) => <Badge status={item.status} />,
              },
              {
                key: "acoes",
                label: "Ações",
                render: (item) => (
                  <div className="table-actions">
                    <Link
                      className="icon-button"
                      title="Visualizar benefício"
                      aria-label={`Visualizar ${item.nome}`}
                      to={`/beneficios/${item.id}`}
                    >
                      <Eye size={17} />
                    </Link>
                    <button
                      className="icon-button"
                      title="Editar benefício"
                      aria-label={`Editar ${item.nome}`}
                      onClick={() => openForm(item)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button"
                      title="Gerenciar conveniados"
                      aria-label={`Gerenciar conveniados de ${item.nome}`}
                      onClick={() => {
                        setLinking(item);
                        setSelectedPartner("");
                        setFormError("");
                      }}
                    >
                      <Link2 size={17} />
                    </button>
                    {item.status !== "DESCONTINUADO" && (
                      <button
                        className="icon-button"
                        title="Descontinuar benefício"
                        aria-label={`Descontinuar ${item.nome}`}
                        onClick={() => setDiscontinuing(item)}
                      >
                        <Power size={17} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            title={
              loading
                ? "Carregando benefícios..."
                : "Nenhum benefício encontrado"
            }
            description="Ajuste os filtros ou cadastre um novo benefício."
          />
        )}
        <Pagination
          page={currentPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </section>
      {formOpen && (
        <Modal
          title={editing ? "Editar benefício" : "Cadastrar benefício"}
          description="Defina a condição e as regras de concessão usadas pela plataforma."
          onClose={() => {
            if (!submitting) setFormOpen(false);
          }}
          wide
        >
          <form onSubmit={submit} className="form-grid">
            <div className="full-width">
              <Field label="Nome do benefício" required>
                <input
                  required
                  maxLength={150}
                  value={form.nome}
                  onChange={(event) =>
                    setForm({ ...form, nome: event.target.value })
                  }
                  placeholder="Ex.: Bem-estar e saúde"
                />
              </Field>
            </div>
            <div className="full-width">
              <Field label="Descrição">
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(event) =>
                    setForm({ ...form, descricao: event.target.value })
                  }
                  placeholder="Descreva as condições do benefício."
                />
              </Field>
            </div>
            <Field label="Tipo de benefício" required>
              <select
                value={form.tipo_beneficio}
                onChange={(event) =>
                  setForm({
                    ...form,
                    tipo_beneficio: event.target
                      .value as Beneficio["tipo_beneficio"],
                  })
                }
              >
                <option value="PERCENTUAL">Desconto percentual</option>
                <option value="VALOR_FIXO">Valor fixo</option>
              </select>
            </Field>
            <Field
              label={
                form.tipo_beneficio === "PERCENTUAL"
                  ? "Percentual (%)"
                  : "Valor (R$)"
              }
              required
            >
              <input
                type="number"
                required
                min="0.01"
                max={form.tipo_beneficio === "PERCENTUAL" ? 100 : undefined}
                step="0.01"
                value={form.valor}
                onChange={(event) =>
                  setForm({ ...form, valor: event.target.value })
                }
                placeholder={
                  form.tipo_beneficio === "PERCENTUAL" ? "20" : "50,00"
                }
              />
            </Field>
            <Field label="Limite de utilizações por ciclo" required>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.quantidade_maxima_utilizacoes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantidade_maxima_utilizacoes: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as Beneficio["status"],
                  })
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="DESCONTINUADO">Descontinuado</option>
              </select>
            </Field>
            <div className="full-width">
              <Field
                label="Tipo de renovação"
                required
                hint="Calendário fixo usa ciclos definidos. Janela móvel conta um intervalo a partir da referência escolhida."
              >
                <select
                  value={form.tipo_janela}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tipo_janela: event.target
                        .value as Beneficio["tipo_janela"],
                    })
                  }
                >
                  <option value="CALENDARIO_FIXO">Calendário fixo</option>
                  <option value="JANELA_MOVEL">Janela móvel</option>
                </select>
              </Field>
            </div>
            {form.tipo_janela === "CALENDARIO_FIXO" ? (
              <>
                <Field label="Unidade do ciclo" required>
                  <select
                    value={form.unidade_ciclo}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        unidade_ciclo: event.target
                          .value as BeneficioForm["unidade_ciclo"],
                      })
                    }
                  >
                    <option value="SEMANA">Semana</option>
                    <option value="MES">Mês</option>
                    <option value="ANO">Ano</option>
                  </select>
                </Field>
                <Field
                  label="Data de reset"
                  hint="Campo opcional previsto no contrato da API."
                >
                  <input
                    type="date"
                    value={form.dia_reset}
                    onChange={(event) =>
                      setForm({ ...form, dia_reset: event.target.value })
                    }
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Intervalo" required>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.intervalo_valor}
                    onChange={(event) =>
                      setForm({ ...form, intervalo_valor: event.target.value })
                    }
                  />
                </Field>
                <Field label="Unidade do intervalo" required>
                  <select
                    value={form.intervalo_unidade}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        intervalo_unidade: event.target
                          .value as BeneficioForm["intervalo_unidade"],
                      })
                    }
                  >
                    <option value="DIA">Dias</option>
                    <option value="MES">Meses</option>
                  </select>
                </Field>
                <div className="full-width">
                  <Field label="Referência de contagem" required>
                    <select
                      value={form.referencia_contagem}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          referencia_contagem: event.target
                            .value as BeneficioForm["referencia_contagem"],
                        })
                      }
                    >
                      <option value="ULTIMA_UTILIZACAO">
                        Última utilização
                      </option>
                      <option value="DATA_ADMISSAO_COLABORADOR">
                        Data de admissão do colaborador
                      </option>
                    </select>
                  </Field>
                </div>
              </>
            )}
            {formError && (
              <p className="full-width form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="modal-footer full-width">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Cadastrar benefício"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {linking && (
        <Modal
          title="Conveniados do benefício"
          description={linking.nome}
          onClose={() => {
            if (!submitting) setLinking(undefined);
          }}
          wide
        >
          <p className="text-muted">
            Vincule estabelecimentos ativos. Ao desvincular, a oferta fica
            inativa para preservar as utilizações anteriores.
          </p>
          {linking.status !== "ATIVO" && (
            <p className="inline-notice">
              Este benefício está{" "}
              {linking.status === "DESCONTINUADO" ? "descontinuado" : "inativo"}
              . Ative-o no cadastro antes de disponibilizar novas ofertas.
            </p>
          )}
          <form className="filters" onSubmit={linkPartner}>
            <select
              aria-label="Conveniado para vincular"
              required
              value={selectedPartner}
              disabled={submitting || linking.status !== "ATIVO"}
              onChange={(event) => setSelectedPartner(event.target.value)}
            >
              <option value="">Selecione um conveniado ativo</option>
              {availablePartners.map((partner) => (
                <option value={partner.id} key={partner.id}>
                  {partner.nome_fantasia}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                submitting || !selectedPartner || linking.status !== "ATIVO"
              }
            >
              <Plus size={17} /> Vincular
            </button>
          </form>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          {linkedOffers.length ? (
            <DataTable
              rows={linkedOffers}
              getRowKey={(item) => item.id}
              columns={[
                {
                  key: "conveniado",
                  label: "Conveniado",
                  render: (item) => (
                    <div>
                      <div className="cell-title">
                        {conveniadoNome(data, item.conveniado_id)}
                      </div>
                      <div className="cell-subtitle">
                        {
                          data.conveniados.find(
                            (partner) => partner.id === item.conveniado_id,
                          )?.categoria
                        }
                      </div>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Oferta",
                  render: (item) => <Badge status={item.status} />,
                },
                {
                  key: "acoes",
                  label: "Ações",
                  render: (item) =>
                    item.status === "ATIVO" ? (
                      <button
                        className="btn btn-secondary"
                        disabled={submitting}
                        onClick={() => changeOffer(item.id, "INATIVO")}
                      >
                        <Unlink size={16} /> Desvincular
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        disabled={
                          submitting ||
                          linking.status !== "ATIVO" ||
                          data.conveniados.find(
                            (partner) => partner.id === item.conveniado_id,
                          )?.status !== "ATIVO"
                        }
                        onClick={() => changeOffer(item.id, "ATIVO")}
                      >
                        <Link2 size={16} /> Reativar
                      </button>
                    ),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="Nenhum conveniado vinculado"
              description="Selecione um estabelecimento acima para criar a primeira oferta deste benefício."
            />
          )}
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => setLinking(undefined)}
            >
              Concluir
            </button>
          </div>
        </Modal>
      )}
      {discontinuing && (
        <Modal
          title="Descontinuar benefício"
          description={`Deseja descontinuar ${discontinuing.nome}? O benefício deixará de estar disponível para novos resgates. As ofertas e utilizações anteriores serão preservadas.`}
          onClose={() => {
            if (!submitting) setDiscontinuing(undefined);
          }}
        >
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => setDiscontinuing(undefined)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              disabled={submitting}
              onClick={discontinue}
            >
              {submitting ? "Descontinuando..." : "Confirmar descontinuação"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
