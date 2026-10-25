import { useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Pencil,
  Plus,
  Power,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
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
import { usePortal } from "../viewmodels/PortalContext";
import {
  capitalizeFirstLetter,
  conveniadoDaUtilizacao,
  formatCnpj,
} from "../models/selectors";
import type { Conveniado } from "../models/types";

const PAGE_SIZE = 8;
type ConveniadoForm = {
  usuario_id: string;
  nome_fantasia: string;
  razao_social: string;
  categoria: string;
  cnpj: string;
  endereco: string;
  status: Conveniado["status"];
};
const blankForm = (): ConveniadoForm => ({
  usuario_id: "",
  nome_fantasia: "",
  razao_social: "",
  categoria: "",
  cnpj: "",
  endereco: "",
  status: "EM_ANALISE",
});

export default function Conveniados() {
  const { data, save, notify, loading } = usePortal();
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("buscar") ?? "");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Conveniado>();
  const [details, setDetails] = useState<Conveniado>();
  const [inactivating, setInactivating] = useState<Conveniado>();
  const [form, setForm] = useState<ConveniadoForm>(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const categories = [
    ...new Set(data.conveniados.map((item) => item.categoria)),
  ].sort();
  const availableUsers = data.usuarios.filter(
    (user) =>
      (user.id === editing?.usuario_id ||
        data.perfis.find((profile) => profile.id === user.perfil_id)?.escopo ===
          "CONVENIADO") &&
      !data.conveniados.some(
        (item) => item.usuario_id === user.id && item.id !== editing?.id,
      ),
  );
  const filtered = data.conveniados.filter((item) => {
    const text =
      `${item.nome_fantasia} ${item.razao_social} ${item.cnpj} ${formatCnpj(item.cnpj)} ${item.categoria} ${item.endereco}`.toLocaleLowerCase(
        "pt-BR",
      );
    return (
      (!status || item.status === status) &&
      (!category || item.categoria === category) &&
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

  function openForm(item?: Conveniado) {
    setEditing(item);
    setForm(
      item
        ? {
            usuario_id: String(item.usuario_id),
            nome_fantasia: item.nome_fantasia,
            razao_social: item.razao_social,
            categoria: item.categoria,
            cnpj: formatCnpj(item.cnpj),
            endereco: item.endereco,
            status: item.status,
          }
        : blankForm(),
    );
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const cnpj = form.cnpj.replace(/\D/g, "");
    if (!form.usuario_id) {
      setFormError("Selecione o usuário responsável por este conveniado.");
      return;
    }
    if (cnpj.length !== 14) {
      setFormError("Informe um CNPJ com 14 dígitos.");
      return;
    }
    if (
      [
        form.nome_fantasia,
        form.razao_social,
        form.categoria,
        form.endereco,
      ].some((value) => !value.trim())
    ) {
      setFormError("Preencha os campos obrigatórios com dados válidos.");
      return;
    }
    if (
      data.conveniados.some(
        (item) =>
          item.id !== editing?.id && item.cnpj.replace(/\D/g, "") === cnpj,
      )
    ) {
      setFormError("Este CNPJ já está cadastrado.");
      return;
    }
    setSubmitting(true);
    try {
      await save("conveniados", editing?.id, {
        ...form,
        usuario_id: Number(form.usuario_id),
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social.trim(),
        categoria: form.categoria.trim(),
        cnpj,
        endereco: form.endereco.trim(),
      });
      notify(editing ? "Conveniado atualizado." : "Conveniado cadastrado.");
      setFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o conveniado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function inactivate() {
    if (!inactivating) return;
    setSubmitting(true);
    try {
      await save("conveniados", inactivating.id, { status: "INATIVO" });
      notify("Conveniado inativado. O histórico foi preservado.");
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

  const activeOfferCount = (id: number) =>
    data.ofertas.filter(
      (item) => item.conveniado_id === id && item.status === "ATIVO",
    ).length;
  return (
    <>
      <PageHeader
        eyebrow="REDE DE PARCEIROS"
        title="Conveniados"
        description="Gerencie os estabelecimentos que fazem parte da nossa rede."
        actions={
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => openForm()}
          >
            <Plus size={18} /> Cadastrar conveniado
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total de conveniados"
          value={data.conveniados.length}
          icon={<Building2 size={21} />}
          detail="Estabelecimentos cadastrados"
        />
        <StatCard
          label="Conveniados ativos"
          value={
            data.conveniados.filter((item) => item.status === "ATIVO").length
          }
          icon={<CheckCircle2 size={21} />}
          tone="green"
          detail="Prontos para oferecer benefícios"
        />
        <StatCard
          label="Em análise"
          value={
            data.conveniados.filter((item) => item.status === "EM_ANALISE")
              .length
          }
          icon={<Clock3 size={21} />}
          tone="amber"
          detail="Aguardando liberação da FCV"
        />
        <StatCard
          label="Conveniados inativos"
          value={
            data.conveniados.filter((item) => item.status === "INATIVO").length
          }
          icon={<Power size={21} />}
          tone="purple"
          detail="Histórico preservado"
        />
      </div>
      <section className="panel" aria-label="Lista de conveniados">
        <div className="filters">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por nome, CNPJ, categoria ou endereço..."
          />
          <select
            aria-label="Filtrar conveniados por status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select
            aria-label="Filtrar conveniados por categoria"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as categorias</option>
            {categories.map((value) => (
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
                label: "Conveniado",
                render: (item) => (
                  <div>
                    <div className="cell-title">{item.nome_fantasia}</div>
                    <div className="cell-subtitle">{item.razao_social}</div>
                  </div>
                ),
              },
              {
                key: "cnpj",
                label: "CNPJ",
                render: (item) => formatCnpj(item.cnpj),
              },
              {
                key: "categoria",
                label: "Categoria",
                render: (item) => item.categoria,
              },
              {
                key: "endereco",
                label: "Endereço",
                render: (item) => (
                  <span className="cell-subtitle">{item.endereco}</span>
                ),
              },
              {
                key: "ofertas",
                label: "Ofertas ativas",
                render: (item) => activeOfferCount(item.id),
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
                    <button
                      className="icon-button"
                      title="Visualizar conveniado"
                      aria-label={`Visualizar ${item.nome_fantasia}`}
                      onClick={() => setDetails(item)}
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      className="icon-button"
                      title="Editar conveniado"
                      aria-label={`Editar ${item.nome_fantasia}`}
                      onClick={() => openForm(item)}
                    >
                      <Pencil size={17} />
                    </button>
                    {item.status !== "INATIVO" && (
                      <button
                        className="icon-button"
                        title="Inativar conveniado"
                        aria-label={`Inativar ${item.nome_fantasia}`}
                        onClick={() => setInactivating(item)}
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
                ? "Carregando conveniados..."
                : "Nenhum conveniado encontrado"
            }
            description="Ajuste os filtros ou cadastre um novo estabelecimento."
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
          title={editing ? "Editar conveniado" : "Cadastrar conveniado"}
          description="Preencha os dados do estabelecimento e vincule o usuário responsável."
          onClose={() => {
            if (!submitting) setFormOpen(false);
          }}
          wide
        >
          <form onSubmit={submit} className="form-grid">
            <Field label="Nome fantasia" required>
              <input
                required
                maxLength={150}
                value={form.nome_fantasia}
                onChange={(event) =>
                  setForm({ ...form, nome_fantasia: event.target.value })
                }
                placeholder="Nome do estabelecimento"
              />
            </Field>
            <Field label="Razão social" required>
              <input
                required
                maxLength={150}
                value={form.razao_social}
                onChange={(event) =>
                  setForm({ ...form, razao_social: event.target.value })
                }
                placeholder="Razão social registrada"
              />
            </Field>
            <Field
              label="CNPJ"
              required
              hint="Informe os 14 dígitos, com ou sem pontuação."
            >
              <input
                required
                maxLength={18}
                inputMode="numeric"
                value={form.cnpj}
                onChange={(event) => {
                  const cnpj = event.currentTarget.value.replace(
                    /[^\d./-]/g,
                    "",
                  );
                  setForm((current) => ({ ...current, cnpj }));
                }}
                placeholder="00.000.000/0000-00"
              />
            </Field>
            <Field label="Categoria" required>
              <input
                required
                maxLength={60}
                list="categorias-conveniados"
                value={form.categoria}
                onChange={(event) =>
                  setForm({ ...form, categoria: event.target.value })
                }
                placeholder="Ex.: Alimentação"
              />
              <datalist id="categorias-conveniados">
                {categories.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </Field>
            <Field
              label="Usuário responsável"
              required
              hint="Selecione uma conta do perfil Conveniado que ainda não possua vínculo."
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
                    {capitalizeFirstLetter(user.nome)} · {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as Conveniado["status"],
                  })
                }
              >
                <option value="EM_ANALISE">Em análise</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </Field>
            <div className="full-width">
              <Field label="Endereço completo" required>
                <input
                  required
                  maxLength={255}
                  value={form.endereco}
                  onChange={(event) =>
                    setForm({ ...form, endereco: event.target.value })
                  }
                  placeholder="Rua, número, bairro, cidade e estado"
                />
              </Field>
            </div>
            {!availableUsers.length && (
              <p className="full-width inline-notice">
                Não há uma conta do perfil Conveniado sem vínculo. Solicite ao
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
                    : "Cadastrar conveniado"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {details && (
        <Modal
          title="Detalhes do conveniado"
          description={details.nome_fantasia}
          onClose={() => setDetails(undefined)}
        >
          <DetailList
            items={[
              { label: "Status", value: <Badge status={details.status} /> },
              { label: "Razão social", value: details.razao_social },
              { label: "CNPJ", value: formatCnpj(details.cnpj) },
              { label: "Categoria", value: details.categoria },
              { label: "Endereço", value: details.endereco },
              {
                label: "Usuário responsável",
                value:
                  data.usuarios.find((user) => user.id === details.usuario_id)
                    ?.nome || "Usuário não disponível",
              },
              { label: "Ofertas ativas", value: activeOfferCount(details.id) },
              {
                label: "Registros de utilização",
                value: data.utilizacoes.filter(
                  (item) =>
                    conveniadoDaUtilizacao(data, item)?.id === details.id,
                ).length,
              },
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setDetails(undefined)}
            >
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                openForm(details);
                setDetails(undefined);
              }}
            >
              <Pencil size={16} /> Editar cadastro
            </button>
          </div>
        </Modal>
      )}
      {inactivating && (
        <ConfirmModal
          title="Inativar conveniado"
          description={`Deseja inativar ${inactivating.nome_fantasia}? O estabelecimento deixará de registrar resgates. As ofertas e utilizações anteriores serão preservadas.`}
          onClose={() => {
            if (!submitting) setInactivating(undefined);
          }}
          onConfirm={inactivate}
          confirming={submitting}
          confirmLabel="Confirmar inativação"
          confirmingLabel="Inativando..."
        />
      )}
    </>
  );
}
