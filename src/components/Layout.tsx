import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gift,
  Handshake,
  ClipboardList,
  Megaphone,
  ChartNoAxesCombined,
  ShieldCheck,
  LogOut,
  HelpCircle,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../viewmodels/AuthContext";
import { usePortal } from "../viewmodels/PortalContext";
import { initials, isAdministrador } from "../models/selectors";
import Brand from "./Brand";
import PortalSearch from "./PortalSearch";
import NotificationCenter from "./NotificationCenter";
const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/beneficios", label: "Benefícios", icon: Gift },
  { to: "/conveniados", label: "Conveniados", icon: Handshake },
  { to: "/utilizacoes", label: "Utilizações", icon: ClipboardList },
  { to: "/campanhas", label: "Campanhas e eventos", icon: Megaphone },
  { to: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
  { to: "/perfis", label: "Configurações", icon: ShieldCheck },
];
export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { loading, error, reload, toast, data } = usePortal();
  const [open, setOpen] = useState(false),
    [help, setHelp] = useState(false);
  const admin = isAdministrador(user!, data);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para conteúdo
      </a>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/" className="brand-link" onClick={() => setOpen(false)}>
          <Brand compact />
        </Link>
        <div className="workspace-label">Gestão</div>
        <nav className="main-navigation" aria-label="Menu principal">
          {navigation
            .filter((item) => item.to !== "/perfis" || admin)
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                to={to}
                key={to}
                end={to === "/"}
                onClick={() => {
                  setOpen(false);
                  setHelp(false);
                }}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} />
                <span>{label}</span>
                {to === "/campanhas" && (
                  <span className="nav-count" aria-hidden="true">
                    {data.campanhas.filter((c) => c.status === "ATIVA").length}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-help" type="button" onClick={() => setHelp(!help)}><HelpCircle size={20} />Ajuda</button>
          <div className="sidebar-user">
            <Link to="/meu-perfil" className="sidebar-profile-link" aria-label="Abrir meu perfil" aria-current={location.pathname === "/meu-perfil" ? "page" : undefined} onClick={() => { setOpen(false); setHelp(false); }}>
              <span className="avatar" aria-hidden="true">{initials(user!.nome)}</span>
              <div><strong>{user!.nome}</strong><small>{admin ? "Administrador FCV" : "Operador FCV"}</small></div>
            </Link>
            <button
              className="icon-button"
              aria-label="Sair da conta"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
            <PortalSearch />
          </div>
          <div className="topbar-right">
            <NotificationCenter />
            <Link to="/meu-perfil" className="profile-link" aria-label="Abrir meu perfil" aria-current={location.pathname === "/meu-perfil" ? "page" : undefined}>
              <span className="avatar small" aria-hidden="true">{initials(user!.nome)}</span>
              <div className="topbar-identity"><strong>{user!.nome}</strong><small>{admin ? "Administrador" : "Operador"}</small></div>
            </Link>
          </div>
        </header>
        <main id="main" className="page-content" tabIndex={-1}>
          {help && (
            <section className="inline-notice">
              <h2>Sobre o portal FCV</h2>
              <p>
                Use o menu para gerenciar cadastros, acompanhar utilizações e
                consultar relatórios. Dados do aplicativo e do terminal são
                administrados pela API central.
              </p>
              <button className="button-link" onClick={() => setHelp(false)}>
                Fechar orientação
              </button>
            </section>
          )}
          {loading ? (
            <div className="loading-state" role="status">
              <span className="spinner" />
              <h2>Carregando seu portal</h2>
              <p>Estamos organizando as informações para você.</p>
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <AlertCircle size={32} />
              <h2>Não foi possível carregar os dados</h2>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => void reload()}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <Outlet key={location.pathname + location.search} />
          )}
          <footer className="page-footer">
            <span>Fundação Cristiano Varella · Pela vida.</span>
            <span>Portal de benefícios e relacionamento</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.type === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
