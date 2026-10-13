import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Eye,
  LockKeyhole,
  Pencil,
  Plus,
  Power,
  ShieldCheck,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
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
import { useAuth } from "../viewmodels/AuthContext";
import { usePortal } from "../viewmodels/PortalContext";
import { formatDate, isAdministrador } from "../models/selectors";
import type { Escopo, Perfil, Usuario } from "../models/types";

const PAGE_SIZE = 8;
const permissions = [
  { value: "cadastros", label: "Cadastros" },
  { value: "campanhas", label: "Campanhas e eventos" },
  { value: "utilizacoes", label: "Utilizações" },
  { value: "relatorios", label: "Relatórios" },
  { value: "tudo", label: "Todas as permissões" },
];
const scopeLabels: Record<Escopo, string> = {
  FCV: "Equipe FCV · Portal web",
  COLABORADOR: "Colaborador · Aplicativo",
  CONVENIADO: "Conveniado · Aplicativo",
};
type ProfileForm = {
  nome: string;
  escopo: Escopo;
  descricao: string;
  permissoes: string[];
  status: Perfil["status"];
};
type UserForm = {
  nome: string;
  email: string;
  perfil_id: string;
  status: Usuario["status"];
  senha: string;
};
const blankProfile = (): ProfileForm => ({
  nome: "",
  escopo: "FCV",
  descricao: "",
  permissoes: ["cadastros"],
  status: "ATIVO",
});
const blankUser = (): UserForm => ({
  nome: "",
  email: "",
  perfil_id: "",
  status: "ATIVO",
  senha: "",
});
const protectedProfile = (profile: Perfil) =>
  profile.id === 1 || profile.nome === "FCV_ADMINISTRADOR";
const permissionLabel = (permission: string) =>
  permissions.find((item) => item.value === permission)?.label ??
  (
    {
      carteira: "Carteira de benefícios",
      qrcode: "QR de resgate",
      historico: "Histórico pessoal",
      validar: "Validação de resgates",
      historico_estabelecimento: "Histórico do estabelecimento",
    } as Record<string, string>
  )[permission] ??
  permission;

export default function Perfis() {
  const { user } = useAuth();
  const { data, save, notify, loading } = usePortal();
  const admin = user !== null && isAdministrador(user, data);
  const [tab, setTab] = useState<"perfis" | "usuarios">("perfis");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("buscar") ?? "");
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("");
  const [page, setPage] = useState(1);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Perfil>();
  const [editingUser, setEditingUser] = useState<Usuario>();
  const [profileDetails, setProfileDetails] = useState<Perfil>();
  const [userDetails, setUserDetails] = useState<Usuario>();
  const [inactivating, setInactivating] = useState<
    { type: "perfil"; item: Perfil } | { type: "usuario"; item: Usuario }
  >();
  const [profileForm, setProfileForm] = useState<ProfileForm>(blankProfile);
  const [userForm, setUserForm] = useState<UserForm>(blankUser);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editingProtected =
    editingProfile !== undefined && protectedProfile(editingProfile);
  const editingSelf = editingUser?.id === user?.id;
  const profileFor = (id: number) =>
    data.perfis.find((profile) => profile.id === id);
  const filteredProfiles = data.perfis.filter(
    (item) =>
      (!status || item.status === status) &&
      (!scope || item.escopo === scope) &&
      `${item.nome} ${item.descricao ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  const filteredUsers = data.usuarios.filter(
    (item) =>
      (!status || item.status === status) &&
      (!scope || profileFor(item.perfil_id)?.escopo === scope) &&
      `${item.nome} ${item.email} ${profileFor(item.perfil_id)?.nome ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  const total =
    tab === "perfis" ? filteredProfiles.length : filteredUsers.length;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const start = (currentPage - 1) * PAGE_SIZE;
  const availableProfiles = data.perfis.filter(
    (profile) =>
      profile.status === "ATIVO" || profile.id === editingUser?.perfil_id,
  );

  function changeTab(next: "perfis" | "usuarios") {
    setTab(next);
    setSearch("");
    setStatus("");
    setScope("");
    setPage(1);
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "perfis"
        : event.key === "End"
          ? "usuarios"
          : tab === "perfis"
            ? "usuarios"
            : "perfis";
    changeTab(next);
    document.getElementById(`access-tab-${next}`)?.focus();
  }
  function openProfile(item?: Perfil) {
    if (!admin) return;
    setEditingProfile(item);
    setProfileForm(
      item
        ? {
            nome: item.nome,
            escopo: item.escopo,
            descricao: item.descricao ?? "",
            permissoes: [...(item.permissoes ?? [])],
            status: item.status,
          }
        : blankProfile(),
    );
    setFormError("");
    setProfileFormOpen(true);
  }
  function openUser(item?: Usuario) {
    if (!admin) return;
    setEditingUser(item);
    setUserForm(
      item
        ? {
            nome: item.nome,
            email: item.email,
            perfil_id: String(item.perfil_id),
            status: item.status,
            senha: "",
          }
        : blankUser(),
    );
    setFormError("");
    setUserFormOpen(true);
  }
  function closeUser() {
    if (!submitting) {
      setUserFormOpen(false);
      setUserForm(blankUser());
    }
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!admin) {
      setFormError("Somente o administrador FCV pode alterar perfis.");
      return;
    }
    const name = profileForm.nome.trim();
    if (!name) {
      setFormError("Informe o nome do perfil.");
      return;
    }
    if (
      data.perfis.some(
        (item) =>
          item.id !== editingProfile?.id &&
          item.nome.toLocaleLowerCase("pt-BR") ===
            name.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setFormError("Já existe um perfil com este nome.");
      return;
    }
    if (
      editingProtected &&
      (name !== editingProfile?.nome ||
        profileForm.escopo !== editingProfile?.escopo ||
        profileForm.status !== editingProfile?.status)
    ) {
      setFormError(
        "O nome, escopo e status do perfil administrador são protegidos.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await save(
        "perfis",
        editingProfile?.id,
        editingProtected
          ? { descricao: profileForm.descricao.trim() || null }
          : {
              ...profileForm,
              nome: name,
              descricao: profileForm.descricao.trim() || null,
              permissoes: [...new Set(profileForm.permissoes)],
            },
      );
      notify(editingProfile ? "Perfil atualizado." : "Perfil cadastrado.");
      setProfileFormOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o perfil.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!admin) {
      setFormError("Somente o administrador FCV pode alterar usuários.");
      return;
    }
    const name = userForm.nome.trim();
    const email = userForm.email.trim().toLocaleLowerCase("pt-BR");
    if (!name || !email || !userForm.perfil_id) {
      setFormError("Preencha nome, e-mail e perfil de acesso.");
      return;
    }
    if (
      data.usuarios.some(
        (item) =>
          item.id !== editingUser?.id &&
          item.email.toLocaleLowerCase("pt-BR") === email,
      )
    ) {
      setFormError("Este e-mail já está cadastrado.");
      return;
    }
    if (
      (!editingUser || userForm.senha.length > 0) &&
      userForm.senha.length < 8
    ) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (
      editingSelf &&
      (Number(userForm.perfil_id) !== editingUser?.perfil_id ||
        userForm.status !== editingUser?.status)
    ) {
      setFormError(
        "Você não pode alterar seu próprio perfil ou status nesta sessão.",
      );
      return;
    }
    const selectedProfile = profileFor(Number(userForm.perfil_id));
    if (
      !selectedProfile ||
      (selectedProfile.status !== "ATIVO" &&
        selectedProfile.id !== editingUser?.perfil_id)
    ) {
      setFormError("Selecione um perfil ativo.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<Usuario> = {
        nome: name,
        email,
        ...(editingSelf
          ? {}
          : { perfil_id: Number(userForm.perfil_id), status: userForm.status }),
        ...(userForm.senha ? { senha: userForm.senha } : {}),
      };
      await save("usuarios", editingUser?.id, payload);
      notify(editingUser ? "Usuário atualizado." : "Usuário cadastrado.");
      setUserFormOpen(false);
      setUserForm(blankUser());
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o usuário.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function inactivate() {
    if (!inactivating || !admin) return;
    if (inactivating.type === "perfil" && protectedProfile(inactivating.item)) {
      notify("O perfil administrador é protegido.", "error");
      return;
    }
    if (inactivating.type === "usuario" && inactivating.item.id === user?.id) {
      notify("Você não pode inativar sua própria conta.", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (inactivating.type === "perfil")
        await save("perfis", inactivating.item.id, { status: "INATIVO" });
      else await save("usuarios", inactivating.item.id, { status: "INATIVO" });
      notify(
        `${inactivating.type === "perfil" ? "Perfil" : "Usuário"} inativado. Os vínculos foram preservados.`,
      );
      setInactivating(undefined);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível inativar o registro.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!admin)
    return (
      <>
        <PageHeader
          title="Perfis e usuários"
          description="Configuração de acesso à plataforma FCV."
        />
        <section className="panel">
          <EmptyState
            title="Acesso exclusivo do administrador FCV"
            description="O operador gerencia os cadastros, campanhas e utilizações. A criação e edição de usuários e perfis são atribuições do administrador."
          />
        </section>
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="CONFIGURAÇÕES"
        title="Perfis e usuários"
        description="Organize os acessos e mantenha as contas da plataforma atualizadas."
        actions={
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => (tab === "perfis" ? openProfile() : openUser())}
          >
            <Plus size={18} />{" "}
            {tab === "perfis" ? "Novo perfil" : "Novo usuário"}
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Perfis de acesso"
          value={data.perfis.length}
          icon={<Shield size={21} />}
          detail="Escopos e permissões definidos"
        />
        <StatCard
          label="Perfis ativos"
          value={data.perfis.filter((item) => item.status === "ATIVO").length}
          icon={<ShieldCheck size={21} />}
          tone="green"
          detail="Disponíveis para novas contas"
        />
        <StatCard
          label="Usuários ativos"
          value={data.usuarios.filter((item) => item.status === "ATIVO").length}
          icon={<UserCheck size={21} />}
          tone="purple"
          detail="Contas com status ativo"
        />
        <StatCard
          label="Contas da equipe FCV"
          value={
            data.usuarios.filter(
              (item) => profileFor(item.perfil_id)?.escopo === "FCV",
            ).length
          }
          icon={<Users size={21} />}
          tone="amber"
          detail="Acesso ao portal web"
        />
      </div>
      <div className="access-notice">
        <ShieldCheck size={22} />
        <div>
          <strong>O administrador herda as funções do operador.</strong>
          <p>
            Somente o administrador FCV pode gerenciar usuários e perfis.
            Colaboradores e conveniados acessam suas próprias visões no
            aplicativo.
          </p>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Configurações de acesso">
        {(["perfis", "usuarios"] as const).map((value) => (
          <button
            type="button"
            key={value}
            className={`tab ${tab === value ? "active" : ""}`}
            id={`access-tab-${value}`}
            role="tab"
            aria-selected={tab === value}
            aria-controls={`access-panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => changeTab(value)}
            onKeyDown={tabKey}
          >
            {value === "perfis" ? <Shield size={17} /> : <Users size={17} />}
            {value === "perfis" ? "Perfis de acesso" : "Usuários"}
          </button>
        ))}
      </div>
      <section
        className="panel"
        role="tabpanel"
        id={`access-panel-${tab}`}
        aria-labelledby={`access-tab-${tab}`}
      >
        <div className="filters">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={
              tab === "perfis"
                ? "Buscar por nome ou descrição do perfil..."
                : "Buscar por nome, e-mail ou perfil..."
            }
          />
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select
            aria-label="Filtrar por escopo de acesso"
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os escopos</option>
            <option value="FCV">Equipe FCV</option>
            <option value="COLABORADOR">Colaborador</option>
            <option value="CONVENIADO">Conveniado</option>
          </select>
        </div>
        {tab === "perfis" ? (
          filteredProfiles.length ? (
            <DataTable
              rows={filteredProfiles.slice(start, start + PAGE_SIZE)}
              getRowKey={(item) => item.id}
              columns={[
                {
                  key: "nome",
                  label: "Perfil de acesso",
                  render: (item) => (
                    <div>
                      <div className="cell-title">{item.nome}</div>
                      <div className="cell-subtitle">
                        {item.descricao || "Sem descrição"}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "escopo",
                  label: "Escopo",
                  render: (item) => scopeLabels[item.escopo],
                },
                {
                  key: "usuarios",
                  label: "Usuários vinculados",
                  render: (item) =>
                    data.usuarios.filter((entry) => entry.perfil_id === item.id)
                      .length,
                },
                {
                  key: "permissoes",
                  label: "Permissões",
                  render: (item) => (
                    <span className="cell-subtitle">
                      {item.permissoes?.length
                        ? item.permissoes.map(permissionLabel).join(" · ")
                        : "Nenhuma cadastrada"}
                    </span>
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
                      <button
                        className="icon-button"
                        title="Visualizar perfil"
                        aria-label={`Visualizar perfil ${item.nome}`}
                        onClick={() => setProfileDetails(item)}
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        className="icon-button"
                        title="Editar perfil"
                        aria-label={`Editar perfil ${item.nome}`}
                        onClick={() => openProfile(item)}
                      >
                        <Pencil size={17} />
                      </button>
                      {item.status === "ATIVO" && !protectedProfile(item) && (
                        <button
                          className="icon-button"
                          title="Inativar perfil"
                          aria-label={`Inativar perfil ${item.nome}`}
                          onClick={() =>
                            setInactivating({ type: "perfil", item })
                          }
                        >
                          <Power size={17} />
                        </button>
                      )}
                      {protectedProfile(item) && (
                        <span
                          className="text-muted"
                          title="Perfil administrador protegido"
                        >
                          <LockKeyhole
                            size={16}
                            aria-label="Perfil protegido"
                          />
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState
              title={
                loading ? "Carregando perfis..." : "Nenhum perfil encontrado"
              }
              description="Ajuste os filtros ou cadastre um novo perfil."
            />
          )
        ) : filteredUsers.length ? (
          <DataTable
            rows={filteredUsers.slice(start, start + PAGE_SIZE)}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "nome",
                label: "Usuário",
                render: (item) => (
                  <div>
                    <div className="cell-title">
                      {item.nome}
                      {item.id === user?.id ? " · Você" : ""}
                    </div>
                    <div className="cell-subtitle">{item.email}</div>
                  </div>
                ),
              },
              {
                key: "perfil",
                label: "Perfil de acesso",
                render: (item) => (
                  <span className="cell-title">
                    {profileFor(item.perfil_id)?.nome ||
                      `Perfil #${item.perfil_id}`}
                  </span>
                ),
              },
              {
                key: "escopo",
                label: "Escopo",
                render: (item) => {
                  const profile = profileFor(item.perfil_id);
                  return profile
                    ? scopeLabels[profile.escopo]
                    : "Não disponível";
                },
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
                      title="Visualizar usuário"
                      aria-label={`Visualizar usuário ${item.nome}`}
                      onClick={() => setUserDetails(item)}
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      className="icon-button"
                      title="Editar usuário"
                      aria-label={`Editar usuário ${item.nome}`}
                      onClick={() => openUser(item)}
                    >
                      <Pencil size={17} />
                    </button>
                    {item.status === "ATIVO" && item.id !== user?.id && (
                      <button
                        className="icon-button"
                        title="Inativar usuário"
                        aria-label={`Inativar usuário ${item.nome}`}
                        onClick={() =>
                          setInactivating({ type: "usuario", item })
                        }
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
              loading ? "Carregando usuários..." : "Nenhum usuário encontrado"
            }
            description="Ajuste os filtros ou cadastre uma nova conta."
          />
        )}
        <Pagination
          page={currentPage}
          total={total}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </section>

      {profileFormOpen && (
        <Modal
          title={editingProfile ? "Editar perfil" : "Novo perfil de acesso"}
          description="Defina o escopo e as permissões do perfil."
          onClose={() => {
            if (!submitting) setProfileFormOpen(false);
          }}
          wide
        >
          <form className="form-grid" onSubmit={submitProfile}>
            {editingProtected && (
              <p className="full-width inline-notice">
                O perfil administrador é protegido. Nome, escopo, permissões e
                status são mantidos para preservar o acesso à gestão.
              </p>
            )}
            <Field label="Nome do perfil" required>
              <input
                required
                maxLength={50}
                disabled={editingProtected}
                value={profileForm.nome}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, nome: event.target.value })
                }
                placeholder="Ex.: FCV_RELATORIOS"
              />
            </Field>
            <Field label="Escopo de acesso" required>
              <select
                disabled={editingProtected}
                value={profileForm.escopo}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    escopo: event.target.value as Escopo,
                  })
                }
              >
                {(Object.entries(scopeLabels) as [Escopo, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <div className="full-width">
              <Field label="Descrição">
                <textarea
                  rows={2}
                  maxLength={255}
                  value={profileForm.descricao}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      descricao: event.target.value,
                    })
                  }
                  placeholder="Descreva a finalidade deste perfil."
                />
              </Field>
            </div>
            <fieldset className="permissions-fieldset full-width">
              <legend>Permissões</legend>
              <div className="permissions-grid">
                {permissions.map((item) => (
                  <label className="permission-option" key={item.value}>
                    <input
                      type="checkbox"
                      disabled={editingProtected}
                      checked={profileForm.permissoes.includes(item.value)}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          permissoes: event.target.checked
                            ? [...profileForm.permissoes, item.value]
                            : profileForm.permissoes.filter(
                                (value) => value !== item.value,
                              ),
                        })
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              {profileForm.permissoes.some(
                (value) => !permissions.some((item) => item.value === value),
              ) && (
                <p className="text-muted">
                  Permissões existentes do aplicativo, mantidas neste cadastro:{" "}
                  {profileForm.permissoes
                    .filter(
                      (value) =>
                        !permissions.some((item) => item.value === value),
                    )
                    .map(permissionLabel)
                    .join(", ")}
                  .
                </p>
              )}
            </fieldset>
            <Field label="Status" required>
              <select
                disabled={editingProtected}
                value={profileForm.status}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    status: event.target.value as Perfil["status"],
                  })
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </Field>
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
                onClick={() => setProfileFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Salvando..."
                  : editingProfile
                    ? "Salvar alterações"
                    : "Cadastrar perfil"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {userFormOpen && (
        <Modal
          title={editingUser ? "Editar usuário" : "Novo usuário"}
          description="Cadastre a conta e escolha o perfil que define sua visão na plataforma."
          onClose={closeUser}
          wide
        >
          <form className="form-grid" onSubmit={submitUser}>
            <Field label="Nome completo" required>
              <input
                required
                maxLength={150}
                autoComplete="name"
                value={userForm.nome}
                onChange={(event) =>
                  setUserForm({ ...userForm, nome: event.target.value })
                }
                placeholder="Nome do usuário"
              />
            </Field>
            <Field label="E-mail" required>
              <input
                type="email"
                required
                maxLength={150}
                autoComplete="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm({ ...userForm, email: event.target.value })
                }
                placeholder="nome@exemplo.com.br"
              />
            </Field>
            <Field label="Perfil de acesso" required>
              <select
                required
                disabled={editingSelf}
                value={userForm.perfil_id}
                onChange={(event) =>
                  setUserForm({ ...userForm, perfil_id: event.target.value })
                }
              >
                <option value="">Selecione o perfil</option>
                {availableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.nome}
                    {profile.status === "INATIVO" ? " (inativo)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select
                disabled={editingSelf}
                value={userForm.status}
                onChange={(event) =>
                  setUserForm({
                    ...userForm,
                    status: event.target.value as Usuario["status"],
                  })
                }
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </Field>
            <div className="full-width">
              <Field
                label={editingUser ? "Nova senha" : "Senha"}
                required={!editingUser}
                hint={
                  editingUser
                    ? "Deixe em branco para manter a senha. Se alterar, use pelo menos 8 caracteres."
                    : "Use pelo menos 8 caracteres."
                }
              >
                <input
                  type="password"
                  required={!editingUser}
                  minLength={8}
                  autoComplete="new-password"
                  value={userForm.senha}
                  onChange={(event) =>
                    setUserForm({ ...userForm, senha: event.target.value })
                  }
                  placeholder={
                    editingUser
                      ? "Preencha somente para alterar"
                      : "Crie a senha de acesso"
                  }
                />
              </Field>
            </div>
            {editingSelf && (
              <p className="full-width inline-notice">
                Você está editando sua própria conta. Seu perfil e status ficam
                protegidos durante esta sessão.
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
                onClick={closeUser}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting || !availableProfiles.length}
              >
                {submitting
                  ? "Salvando..."
                  : editingUser
                    ? "Salvar alterações"
                    : "Cadastrar usuário"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {profileDetails && (
        <Modal
          title="Detalhes do perfil"
          description={profileDetails.nome}
          onClose={() => setProfileDetails(undefined)}
        >
          <DetailList
            items={[
              {
                label: "Status",
                value: <Badge status={profileDetails.status} />,
              },
              { label: "Escopo", value: scopeLabels[profileDetails.escopo] },
              {
                label: "Descrição",
                value: profileDetails.descricao || "Não informada",
              },
              {
                label: "Permissões",
                value: profileDetails.permissoes?.length
                  ? profileDetails.permissoes.map(permissionLabel).join(", ")
                  : "Nenhuma cadastrada",
              },
              {
                label: "Usuários vinculados",
                value: data.usuarios.filter(
                  (item) => item.perfil_id === profileDetails.id,
                ).length,
              },
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setProfileDetails(undefined)}
            >
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                openProfile(profileDetails);
                setProfileDetails(undefined);
              }}
            >
              <Pencil size={16} /> Editar perfil
            </button>
          </div>
        </Modal>
      )}
      {userDetails && (
        <Modal
          title="Detalhes do usuário"
          description={userDetails.nome}
          onClose={() => setUserDetails(undefined)}
        >
          <DetailList
            items={[
              { label: "E-mail", value: userDetails.email },
              { label: "Status", value: <Badge status={userDetails.status} /> },
              {
                label: "Perfil",
                value:
                  profileFor(userDetails.perfil_id)?.nome ||
                  "Perfil não disponível",
              },
              {
                label: "Escopo",
                value: profileFor(userDetails.perfil_id)
                  ? scopeLabels[profileFor(userDetails.perfil_id)!.escopo]
                  : "Não disponível",
              },
              {
                label: "Cadastro",
                value: formatDate(userDetails.data_criacao),
              },
              {
                label: "Colaborador vinculado",
                value:
                  data.colaboradores.find(
                    (item) => item.usuario_id === userDetails.id,
                  )?.matricula || "Sem vínculo",
              },
              {
                label: "Conveniado vinculado",
                value:
                  data.conveniados.find(
                    (item) => item.usuario_id === userDetails.id,
                  )?.nome_fantasia || "Sem vínculo",
              },
            ]}
          />
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setUserDetails(undefined)}
            >
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                openUser(userDetails);
                setUserDetails(undefined);
              }}
            >
              <Pencil size={16} /> Editar usuário
            </button>
          </div>
        </Modal>
      )}
      {inactivating && (
        <Modal
          title={`Inativar ${inactivating.type === "perfil" ? "perfil" : "usuário"}`}
          description={`Deseja inativar ${inactivating.item.nome}? ${inactivating.type === "perfil" ? "O perfil deixará de estar disponível para novas contas. Os vínculos existentes serão preservados." : "O login desta conta será bloqueado. Os cadastros e históricos vinculados serão preservados."}`}
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
