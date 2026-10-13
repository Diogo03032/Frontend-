import { useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Eye,
  History,
  RotateCcw,
  Users,
} from "lucide-react";
import { usePortal } from "../viewmodels/PortalContext";
import {
  beneficioDaUtilizacao,
  colaboradorNome,
  conveniadoDaUtilizacao,
  formatDate,
  formatMoney,
  statusLabel,
} from "../models/selectors";
import {
  Badge,
  DataTable,
  DetailList,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  StatCard,
} from "../components/ui";

type Utilizacao = ReturnType<typeof usePortal>["data"]["utilizacoes"][number];
const PAGE_SIZE = 8;

export default function Utilizacoes() {
  const { data, save, notify } = usePortal();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [conveniado, setConveniado] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Utilizacao | null>(null);
  const [reversal, setReversal] = useState<Utilizacao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const periodoInvalido = !!inicio && !!fim && fim < inicio;

  const rows = useMemo(
    () =>
      data.utilizacoes.filter((uso) => {
        const item = beneficioDaUtilizacao(data, uso);
        const parceiro = conveniadoDaUtilizacao(data, uso);
        const dia = uso.data_solicitacao.slice(0, 10);
        const origem = uso.beneficio_conveniado_id ? "beneficio" : "campanha";
        const texto =
          `${uso.id} ${colaboradorNome(data, uso.colaborador_id)} ${item?.nome ?? ""} ${parceiro?.nome_fantasia ?? ""} ${parceiro?.razao_social ?? ""}`.toLocaleLowerCase(
            "pt-BR",
          );
        return (
          !periodoInvalido &&
          texto.includes(search.toLocaleLowerCase("pt-BR")) &&
          (!status || uso.status === status) &&
          (!inicio || dia >= inicio) &&
          (!fim || dia <= fim) &&
          (!colaborador || uso.colaborador_id === Number(colaborador)) &&
          (!conveniado || parceiro?.id === Number(conveniado)) &&
          (!beneficio || `${origem}:${item?.id}` === beneficio)
        );
      }),
    [
      data,
      search,
      status,
      inicio,
      fim,
      colaborador,
      conveniado,
      beneficio,
      periodoInvalido,
    ],
  );

  const aprovadas = rows.filter((uso) => uso.status === "APROVADA");
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = [...rows]
    .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao))
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  async function estornar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reversal || !motivo.trim() || saving) return;
    const atual = data.utilizacoes.find((uso) => uso.id === reversal.id);
    if (atual?.status !== "APROVADA") {
      notify("Somente utilizações aprovadas podem ser estornadas.", "error");
      setReversal(null);
      return;
    }
    setSaving(true);
    try {
      await save("utilizacoes", reversal.id, {
        status: "ESTORNADA",
        observacoes: [
          reversal.observacoes,
          `Motivo do estorno: ${motivo.trim()}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      notify(
        "Utilização estornada. O registro permanece no histórico.",
        "success",
      );
      setReversal(null);
      setSelected(null);
      setMotivo("");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível estornar a utilização.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function limparFiltros() {
    setSearch("");
    setStatus("");
    setInicio("");
    setFim("");
    setColaborador("");
    setConveniado("");
    setBeneficio("");
    setPage(1);
  }

  return (
    <>
      <PageHeader
        eyebrow="ACOMPANHAMENTO"
        title="Utilizações"
        description="Acompanhe os resgates e consulte o histórico de benefícios da fundação."
      />
      <div className="stats-grid">
        <StatCard
          label="Registros encontrados"
          value={rows.length}
          icon={<History />}
          detail="Conforme os filtros aplicados"
        />
        <StatCard
          label="Utilizações aprovadas"
          value={aprovadas.length}
          icon={<CheckCircle2 />}
          tone="green"
          detail="Estornos excluídos da contagem"
        />
        <StatCard
          label="Colaboradores atendidos"
          value={new Set(aprovadas.map((uso) => uso.colaborador_id)).size}
          icon={<Users />}
          tone="purple"
          detail="Com ao menos um resgate aprovado"
        />
        <StatCard
          label="Valor aplicado"
          value={formatMoney(
            aprovadas.reduce(
              (total, uso) => total + Number(uso.valor_aplicado),
              0,
            ),
          )}
          icon={<CircleDollarSign />}
          tone="amber"
          detail="Soma dos resgates aprovados"
        />
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Histórico de utilizações</h2>
            <p className="text-muted">
              Consulte os registros e seus detalhes. Resgates decididos são
              preservados.
            </p>
          </div>
        </div>
        <div className="filters">
          <SearchField
            value={search}
            onChange={(value) => filter(setSearch, value)}
            placeholder="Buscar por nome, benefício, parceiro ou número"
          />
          <Field label="Status">
            <select
              value={status}
              onChange={(event) => filter(setStatus, event.target.value)}
            >
              <option value="">Todos os status</option>
              {["PENDENTE", "APROVADA", "REPROVADA", "ESTORNADA"].map(
                (item) => (
                  <option key={item} value={item}>
                    {statusLabel(item)}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="De">
            <input
              type="date"
              value={inicio}
              onChange={(event) => filter(setInicio, event.target.value)}
            />
          </Field>
          <Field
            label="Até"
            error={
              periodoInvalido
                ? "A data final deve ser igual ou posterior à inicial."
                : undefined
            }
          >
            <input
              type="date"
              value={fim}
              min={inicio || undefined}
              onChange={(event) => filter(setFim, event.target.value)}
            />
          </Field>
        </div>
        <div className="filters">
          <Field label="Colaborador">
            <select
              value={colaborador}
              onChange={(event) => filter(setColaborador, event.target.value)}
            >
              <option value="">Todos os colaboradores</option>
              {data.colaboradores.map((item) => (
                <option key={item.id} value={item.id}>
                  {colaboradorNome(data, item.id)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Conveniado">
            <select
              value={conveniado}
              onChange={(event) => filter(setConveniado, event.target.value)}
            >
              <option value="">Todos os conveniados</option>
              {data.conveniados.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome_fantasia || item.razao_social}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Benefício ou item">
            <select
              value={beneficio}
              onChange={(event) => filter(setBeneficio, event.target.value)}
            >
              <option value="">Todos os benefícios</option>
              <optgroup label="Benefícios regulares">
                {data.beneficios.map((item) => (
                  <option key={item.id} value={`beneficio:${item.id}`}>
                    {item.nome}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Itens de campanhas">
                {data.itensCampanha.map((item) => (
                  <option key={item.id} value={`campanha:${item.id}`}>
                    {item.nome}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>
          <button className="btn btn-secondary" onClick={limparFiltros}>
            <RotateCcw size={16} /> Limpar filtros
          </button>
        </div>
        {rows.length ? (
          <DataTable
            rows={visibleRows}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: "data",
                label: "Data e registro",
                render: (row) => (
                  <>
                    <span className="cell-title">
                      {formatDate(row.data_solicitacao, true)}
                    </span>
                    <span className="cell-subtitle">
                      #{String(row.id).padStart(5, "0")}
                    </span>
                  </>
                ),
              },
              {
                key: "colaborador",
                label: "Colaborador",
                render: (row) => (
                  <span className="cell-title">
                    {colaboradorNome(data, row.colaborador_id)}
                  </span>
                ),
              },
              {
                key: "beneficio",
                label: "Benefício",
                render: (row) => (
                  <>
                    <span className="cell-title">
                      {beneficioDaUtilizacao(data, row)?.nome ??
                        "Benefício não encontrado"}
                    </span>
                    <span className="cell-subtitle">
                      {row.beneficio_campanha_conveniado_id
                        ? "Item de campanha"
                        : "Benefício regular"}
                    </span>
                  </>
                ),
              },
              {
                key: "parceiro",
                label: "Conveniado",
                render: (row) => {
                  const item = conveniadoDaUtilizacao(data, row);
                  return (
                    item?.nome_fantasia ||
                    item?.razao_social ||
                    "Não encontrado"
                  );
                },
              },
              {
                key: "valor",
                label: "Valor aplicado",
                render: (row) => formatMoney(Number(row.valor_aplicado)),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <Badge status={row.status} />,
              },
              {
                key: "acoes",
                label: "Ações",
                render: (row) => (
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      aria-label={`Ver utilização ${row.id}`}
                      title="Ver detalhes"
                      onClick={() => setSelected(row)}
                    >
                      <Eye size={17} />
                    </button>
                    {row.status === "APROVADA" && (
                      <button
                        className="icon-button danger"
                        aria-label={`Estornar utilização ${row.id}`}
                        title="Estornar"
                        onClick={() => {
                          setReversal(row);
                          setMotivo("");
                        }}
                      >
                        <RotateCcw size={17} />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            title="Nenhuma utilização encontrada"
            description="Ajuste os filtros ou aguarde novos registros de resgate."
            action={
              <button className="btn btn-secondary" onClick={limparFiltros}>
                Limpar filtros
              </button>
            }
          />
        )}
        <Pagination
          page={currentPage}
          total={rows.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </section>
      {selected && (
        <Modal
          title={`Utilização #${String(selected.id).padStart(5, "0")}`}
          description="Dados registrados no histórico de resgates."
          onClose={() => setSelected(null)}
        >
          <div className="detail-status">
            <Badge status={selected.status} />
          </div>
          <DetailList
            items={[
              {
                label: "Colaborador",
                value: colaboradorNome(data, selected.colaborador_id),
              },
              {
                label: "Benefício / item",
                value:
                  beneficioDaUtilizacao(data, selected)?.nome ??
                  "Não encontrado",
              },
              {
                label: "Conveniado",
                value: (() => {
                  const item = conveniadoDaUtilizacao(data, selected);
                  return (
                    item?.nome_fantasia ||
                    item?.razao_social ||
                    "Não encontrado"
                  );
                })(),
              },
              {
                label: "Solicitado em",
                value: formatDate(selected.data_solicitacao, true),
              },
              {
                label: "Decidido em",
                value: selected.data_confirmacao
                  ? formatDate(selected.data_confirmacao, true)
                  : "Ainda não decidido",
              },
              {
                label: "Valor aplicado",
                value: formatMoney(Number(selected.valor_aplicado)),
              },
              {
                label: "Canal de validação",
                value:
                  selected.canal_validacao === "APP_CONVENIADO"
                    ? "Aplicativo do conveniado"
                    : selected.canal_validacao === "TERMINAL_IOT"
                      ? "Terminal IoT"
                      : "Não registrado",
              },
              {
                label: "Observações",
                value: selected.observacoes || "Sem observações",
              },
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
            {selected.status === "APROVADA" && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  setReversal(selected);
                  setSelected(null);
                  setMotivo("");
                }}
              >
                <RotateCcw size={16} /> Estornar utilização
              </button>
            )}
          </div>
        </Modal>
      )}
      {reversal && (
        <Modal
          title="Estornar utilização"
          description={`O registro #${String(reversal.id).padStart(5, "0")} permanecerá no histórico com o status Estornada.`}
          onClose={() => {
            if (!saving) setReversal(null);
          }}
        >
          <form onSubmit={estornar}>
            <DetailList
              items={[
                {
                  label: "Colaborador",
                  value: colaboradorNome(data, reversal.colaborador_id),
                },
                {
                  label: "Benefício",
                  value:
                    beneficioDaUtilizacao(data, reversal)?.nome ??
                    "Não encontrado",
                },
                {
                  label: "Valor aplicado",
                  value: formatMoney(Number(reversal.valor_aplicado)),
                },
              ]}
            />
            <Field
              label="Motivo do estorno"
              required
              hint="Informe o motivo para manter a rastreabilidade do registro."
            >
              <textarea
                required
                autoFocus
                rows={4}
                maxLength={1500}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Descreva por que esta utilização será estornada"
              />
            </Field>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setReversal(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                type="submit"
                disabled={saving || !motivo.trim()}
              >
                {saving ? "Estornando…" : "Confirmar estorno"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
