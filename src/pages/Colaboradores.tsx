import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Pencil,
  Plus,
  UserCheck,
  UserMinus,
  Users,
  UserRoundCheck,
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
import { colaboradorNome, formatDate } from "../models/selectors";
import type { Colaborador } from "../models/types";

const PAGE_SIZE = 8;
type ColaboradorForm = {
  usuario_id: string;
  matricula: string;
  setor: string;
  cargo: string;
  data_admissao: string;
  telefone: string;
  status: Colaborador["status"];
};
const blankForm = (): ColaboradorForm => ({
  usuario_id: "",
  matricula: "",
  setor: "",
  cargo: "",
  data_admissao: "",
  telefone: "",
  status: "ATIVO",
});

export default function Colaboradores() {
  const { data, save, notify, loading } = usePortal();
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("buscar") ?? "");
  const [status, setStatus] = useState("");
  const [setor, setSetor] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador>();
  const [inactivating, setInactivating] = useState<Colaborador>();
  const [form, setForm] = useState<ColaboradorForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sectors = [
    ...new Set(data.colaboradores.map((item) => item.setor)),
  ].sort();
  const availableUsers = data.usuarios.filter(
    (user) =>
      (user.id === editing?.usuario_id ||
        data.perfis.find((profile) => profile.id === user.perfil_id)?.escopo ===
          "COLABORADOR") &&
      !data.colaboradores.some(
        (item) => item.usuario_id === user.id && item.id !== editing?.id,
      ),
  );
  const filtered = data.colaboradores.filter((item) => {
    const user = data.usuarios.find((entry) => entry.id === item.usuario_id);
    const text =
      `${colaboradorNome(data, item.id)} ${user?.email ?? ""} ${item.matricula} ${item.setor} ${item.cargo}`.toLocaleLowerCase(
        "pt-BR",
      );
    return (
      (!status || item.status === status) &&
      (!setor || item.setor === setor) &&
      text.includes(search.trim().toLocaleLowerCase("pt-BR"))
    );
  });
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );
  const visibleRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function openForm(item?: Colaborador) {
    setEditing(item);
    setForm(
      item
        ? {
            usuario_id: String(item.usuario_id),
            matricula: item.matricula,
            setor: item.setor,
            cargo: item.cargo,
            data_admissao: item.data_admissao.slice(0, 10),
            telefone: item.telefone ?? "",
            status: item.status,
          }
        : blankForm(),
    );
    setFormError("");
    setFormOpen(true);
  }

  useInitialAction({
    editar: id => {
      const item = data.colaboradores.find(entry => entry.id === id);
      if (item) openForm(item);
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!form.usuario_id) {
      setFormError("Selecione um usuário para vincular ao colaborador.");
      return;
    }
    if (
      [form.matricula, form.setor, form.cargo].some((value) => !value.trim())
    ) {
      setFormError("Preencha os campos obrigatórios com dados válidos.");
      return;
    }
    if (
      data.colaboradores.some(
        (item) =>
          item.id !== editing?.id &&
          item.matricula.toLocaleLowerCase("pt-BR") ===
            form.matricula.trim().toLocaleLowerCase("pt-BR"),
      )
    ) {
      setFormError("Esta matrícula já está cadastrada.");
      return;
    }
    setSubmitting(true);
    try {
      await save("colaboradores", editing?.id, {
        ...form,
        usuario_id: Number(form.usuario_id),
        matricula: form.matricula.trim(),
        setor: form.setor.trim(),
        cargo: form.cargo.trim(),
        telefone: form.telefone.trim() || null,
      });
      notify(editing ? "Colaborador atualizado." : "Colaborador cadastrado.");
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o colaborador.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function inactivate() {
    if (!inactivating) return;
    setSubmitting(true);
    try {
      await save("colaboradores", inactivating.id, { status: "INATIVO" });
      notify("Colaborador inativado. O histórico foi preservado.");
      setInactivating(undefined);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Não foi possível inativar.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="GESTÃO DE PESSOAS"
        title="Colaboradores"
        description="Cadastre e acompanhe os colaboradores da Fundação."
        actions={
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => openForm()}
          >
            <Plus size={18} /> Novo colaborador
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total de colaboradores"
          value={data.colaboradores.length}
          icon={<Users size={21} />}
          detail="Cadastros na plataforma"
        />
        <StatCard
          label="Colaboradores ativos"
          value={
            data.colaboradores.filter((item) => item.status === "ATIVO").length
          }
          icon={<UserCheck size={21} />}
          tone="green"
          detail="Com acesso aos benefícios"
        />
        <StatCard
          label="Colaboradores afastados"
          value={
            data.colaboradores.filter((item) => item.status === "AFASTADO")
              .length
          }
          icon={<UserRoundCheck size={21} />}
          tone="amber"
          detail="Acesso suspenso por afastamento"
        />
        <StatCard
          label="Colaboradores inativos"
          value={
            data.colaboradores.filter((item) => item.status === "INATIVO")
              .length
          }
          icon={<UserMinus size={21} />}
          tone="purple"
          detail="Histórico preservado"
        />
      </div>
      <section className="panel" aria-label="Lista de colaboradores">
        <div className="filters">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por nome, matrícula, setor ou cargo..."
          />
          <select
            aria-label="Filtrar colaboradores por status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="AFASTADO">Afastados</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select
            aria-label="Filtrar por setor"
            value={setor}
            onChange={(event) => {
              setSetor(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os setores</option>
            {sectors.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        {filtered.length ? (
          <DataTable
            rows={visibleRows}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "nome",
                label: "Colaborador",
                render: (item) => (
                  <div>
                    <div className="cell-title">
                      <Link className="detail-record-link" to={`/colaboradores/${item.id}`}>{colaboradorNome(data, item.id)}</Link>
                    </div>
                    <div className="cell-subtitle">{item.cargo}</div>
                  </div>
                ),
              },
              {
                key: "matricula",
                label: "Matrícula",
                render: (item) => (
                  <span className="cell-title">{item.matricula}</span>
                ),
              },
              { key: "setor", label: "Setor", render: (item) => item.setor },
              {
                key: "admissao",
                label: "Admissão",
                render: (item) => formatDate(item.data_admissao),
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
                      title="Visualizar colaborador"
                      aria-label={`Visualizar ${colaboradorNome(data, item.id)}`}
                      to={`/colaboradores/${item.id}`}
                    >
                      <Eye size={17} />
                    </Link>
                    <button
                      className="icon-button"
                      title="Editar colaborador"
                      aria-label={`Editar ${colaboradorNome(data, item.id)}`}
                      onClick={() => openForm(item)}
                    >
                      <Pencil size={17} />
                    </button>
                    {item.status !== "INATIVO" && (
                      <button
                        className="icon-button"
                        title="Inativar colaborador"
                        aria-label={`Inativar ${colaboradorNome(data, item.id)}`}
                        onClick={() => setInactivating(item)}
                      >
                        <UserMinus size={17} />
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
                ? "Carregando colaboradores..."
                : "Nenhum colaborador encontrado"
            }
            description="Ajuste os filtros ou cadastre um novo colaborador."
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
          title={editing ? "Editar colaborador" : "Novo colaborador"}
          description="Vincule uma conta existente e preencha os dados de trabalho."
          onClose={() => {
            if (!submitting) setFormOpen(false);
          }}
          wide
        >
          <form onSubmit={submit} className="form-grid">
            <Field
              label="Usuário vinculado"
              required
              hint="Selecione uma conta do perfil Colaborador que ainda não possua vínculo."
            >
              <select
                required
                value={form.usuario_id}
                onChange={(event) =>
                  setForm({ ...form, usuario_id: event.target.value })
                }
              >
                <option value="">Selecione o usuário</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} · {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Matrícula" required>
              <input
                required
                maxLength={30}
                value={form.matricula}
                onChange={(event) =>
                  setForm({ ...form, matricula: event.target.value })
                }
                placeholder="Ex.: FCV-0124"
              />
            </Field>
            <Field label="Setor" required>
              <input
                required
                maxLength={100}
                value={form.setor}
                onChange={(event) =>
                  setForm({ ...form, setor: event.target.value })
                }
                placeholder="Ex.: Enfermagem"
              />
            </Field>
            <Field label="Cargo" required>
              <input
                required
                maxLength={100}
                value={form.cargo}
                onChange={(event) =>
                  setForm({ ...form, cargo: event.target.value })
                }
                placeholder="Ex.: Enfermeiro(a)"
              />
            </Field>
            <Field label="Data de admissão" required>
              <input
                type="date"
                required
                value={form.data_admissao}
                onChange={(event) =>
                  setForm({ ...form, data_admissao: event.target.value })
                }
              />
            </Field>
            <Field label="Telefone">
              <input
                type="tel"
                maxLength={20}
                value={form.telefone}
                onChange={(event) =>
                  setForm({ ...form, telefone: event.target.value })
                }
                placeholder="(32) 99999-9999"
              />
            </Field>
            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as Colaborador["status"],
                  })
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="AFASTADO">Afastado</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </Field>
            {!availableUsers.length && (
              <p className="full-width inline-notice">
                Não há uma conta do perfil Colaborador sem vínculo. Solicite ao
                administrador o cadastro em Perfis e usuários.
              </p>
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
                disabled={submitting || !availableUsers.length}
              >
                {submitting
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Cadastrar colaborador"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {inactivating && (
        <Modal
          title="Inativar colaborador"
          description={`Deseja inativar ${colaboradorNome(data, inactivating.id)}? O acesso aos benefícios será bloqueado e os registros anteriores serão preservados.`}
          onClose={() => {
            if (!submitting) setInactivating(undefined);
          }}
        >
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => setInactivating(undefined)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              disabled={submitting}
              onClick={inactivate}
            >
              {submitting ? "Inativando..." : "Confirmar inativação"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
