import {
  Eye,
  Pencil,
  Plus,
  UserCheck,
  UserMinus,
  Users,
  UserRoundCheck,
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
import {
  capitalizeFirstLetter,
  colaboradorNome,
  formatDate,
} from "../models/selectors";
import { useColaboradoresVM } from "../viewmodels/useColaboradoresVM";

export default function Colaboradores() {
  const vm = useColaboradoresVM();

  return (
    <>
      <PageHeader
        eyebrow="GESTÃO DE PESSOAS"
        title="Colaboradores"
        description="Cadastre e acompanhe os colaboradores da Fundação."
        actions={
          <button
            className="btn btn-primary"
            disabled={vm.loading}
            onClick={() => vm.openForm()}
          >
            <Plus size={18} /> Novo colaborador
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total de colaboradores"
          value={vm.data.colaboradores.length}
          icon={<Users size={21} />}
          detail="Cadastros na plataforma"
        />
        <StatCard
          label="Colaboradores ativos"
          value={
            vm.data.colaboradores.filter((item) => item.status === "ATIVO").length
          }
          icon={<UserCheck size={21} />}
          tone="green"
          detail="Com acesso aos benefícios"
        />
        <StatCard
          label="Colaboradores afastados"
          value={
            vm.data.colaboradores.filter((item) => item.status === "AFASTADO")
              .length
          }
          icon={<UserRoundCheck size={21} />}
          tone="amber"
          detail="Acesso suspenso por afastamento"
        />
        <StatCard
          label="Colaboradores inativos"
          value={
            vm.data.colaboradores.filter((item) => item.status === "INATIVO")
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
            value={vm.search}
            onChange={(value) => {
              vm.setSearch(value);
              vm.setPage(1);
            }}
            placeholder="Buscar por nome, matrícula, setor ou cargo..."
          />
          <select
            aria-label="Filtrar colaboradores por status"
            value={vm.status}
            onChange={(event) => {
              vm.setStatus(event.target.value);
              vm.setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="AFASTADO">Afastados</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select
            aria-label="Filtrar por setor"
            value={vm.setor}
            onChange={(event) => {
              vm.setSetor(event.target.value);
              vm.setPage(1);
            }}
          >
            <option value="">Todos os setores</option>
            {vm.sectors.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        {vm.filtered.length ? (
          <DataTable
            rows={vm.visibleRows}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "nome",
                label: "Colaborador",
                render: (item) => (
                  <div>
                    <div className="cell-title">
                      {colaboradorNome(vm.data, item.id)}
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
                    <button
                      className="icon-button"
                      title="Visualizar colaborador"
                      aria-label={`Visualizar ${colaboradorNome(vm.data, item.id)}`}
                      onClick={() => vm.setDetails(item)}
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      className="icon-button"
                      title="Editar colaborador"
                      aria-label={`Editar ${colaboradorNome(vm.data, item.id)}`}
                      onClick={() => vm.openForm(item)}
                    >
                      <Pencil size={17} />
                    </button>
                    {item.status !== "INATIVO" && (
                      <button
                        className="icon-button"
                        title="Inativar colaborador"
                        aria-label={`Inativar ${colaboradorNome(vm.data, item.id)}`}
                        onClick={() => vm.setInactivating(item)}
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
              vm.loading
                ? "Carregando colaboradores..."
                : "Nenhum colaborador encontrado"
            }
            description="Ajuste os filtros ou cadastre um novo colaborador."
          />
        )}
        <Pagination
          page={vm.currentPage}
          total={vm.filtered.length}
          pageSize={vm.PAGE_SIZE}
          onChange={vm.setPage}
        />
      </section>

      {vm.formOpen && (
        <Modal
          title={vm.editing ? "Editar colaborador" : "Novo colaborador"}
          description="Vincule uma conta existente e preencha os dados de trabalho."
          onClose={() => {
            if (!vm.submitting) vm.setFormOpen(false);
          }}
          wide
        >
          <form onSubmit={vm.submit} className="form-grid">
            <Field
              label="Usuário vinculado"
              required
              hint="Selecione uma conta do perfil Colaborador que ainda não possua vínculo."
            >
              <select
                required
                value={vm.form.usuario_id}
                onChange={(event) =>
                  vm.setForm({ ...vm.form, usuario_id: event.target.value })
                }
              >
                <option value="">Selecione o usuário</option>
                {vm.availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {capitalizeFirstLetter(user.nome)} · {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Matrícula" required>
              <input
                required
                maxLength={30}
                value={vm.form.matricula}
                onChange={(event) =>
                  vm.setForm({ ...vm.form, matricula: event.target.value })
                }
                placeholder="Ex.: FCV-0124"
              />
            </Field>
            <Field label="Setor" required>
              <input
                required
                maxLength={100}
                value={vm.form.setor}
                onChange={(event) =>
                  vm.setForm({ ...vm.form, setor: event.target.value })
                }
                placeholder="Ex.: Enfermagem"
              />
            </Field>
            <Field label="Cargo" required>
              <input
                required
                maxLength={100}
                value={vm.form.cargo}
                onChange={(event) =>
                  vm.setForm({ ...vm.form, cargo: event.target.value })
                }
                placeholder="Ex.: Enfermeiro(a)"
              />
            </Field>
            <Field label="Data de admissão" required>
              <input
                type="date"
                required
                value={vm.form.data_admissao}
                onChange={(event) =>
                  vm.setForm({ ...vm.form, data_admissao: event.target.value })
                }
              />
            </Field>
            <Field label="Telefone">
              <input
                type="tel"
                maxLength={20}
                value={vm.form.telefone}
                onChange={(event) => {
                  const telefone = event.currentTarget.value.replace(
                    /[^\d+()\s-]/g,
                    "",
                  );
                  vm.setForm({ ...vm.form, telefone });
                }}
                placeholder="(32) 99999-9999"
              />
            </Field>
            <Field label="Status" required>
              <select
                value={vm.form.status}
                onChange={(event) =>
                  vm.setForm({
                    ...vm.form,
                    status: event.target.value as typeof vm.form.status,
                  })
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="AFASTADO">Afastado</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </Field>
            {!vm.availableUsers.length && (
              <p className="full-width inline-notice">
                Não há uma conta do perfil Colaborador sem vínculo. Solicite ao
                administrador o cadastro em Perfis e usuários.
              </p>
            )}
            {vm.formError && (
              <p className="full-width form-error" role="alert">
                {vm.formError}
              </p>
            )}
            <div className="modal-footer full-width">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={vm.submitting}
                onClick={() => vm.setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={vm.submitting || !vm.availableUsers.length}
              >
                {vm.submitting
                  ? "Salvando..."
                  : vm.editing
                    ? "Salvar alterações"
                    : "Cadastrar colaborador"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {vm.details && (
        <Modal
          title="Detalhes do colaborador"
          description={colaboradorNome(vm.data, vm.details.id)}
          onClose={() => vm.setDetails(undefined)}
        >
          <DetailList
            items={[
              { label: "Status", value: <Badge status={vm.details.status} /> },
              { label: "Matrícula", value: vm.details.matricula },
              { label: "Setor", value: vm.details.setor },
              { label: "Cargo", value: vm.details.cargo },
              { label: "Admissão", value: formatDate(vm.details.data_admissao) },
              { label: "Telefone", value: vm.details.telefone || "Não informado" },
              {
                label: "E-mail",
                value:
                  vm.data.usuarios.find((user) => user.id === vm.details!.usuario_id)
                    ?.email || "Usuário não disponível",
              },
              {
                label: "Registros de utilização",
                value: vm.data.utilizacoes.filter(
                  (item) => item.colaborador_id === vm.details!.id,
                ).length,
              },
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => vm.setDetails(undefined)}
            >
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                vm.openForm(vm.details);
                vm.setDetails(undefined);
              }}
            >
              <Pencil size={16} /> Editar cadastro
            </button>
          </div>
        </Modal>
      )}
      {vm.inactivating && (
        <ConfirmModal
          title="Inativar colaborador"
          description={`Deseja inativar ${colaboradorNome(vm.data, vm.inactivating.id)}? O acesso aos benefícios será bloqueado e os registros anteriores serão preservados.`}
          onClose={() => {
            if (!vm.submitting) vm.setInactivating(undefined);
          }}
          onConfirm={vm.inactivate}
          confirming={vm.submitting}
          confirmLabel="Confirmar inativação"
          confirmingLabel="Inativando..."
        />
      )}
    </>
  );
}
