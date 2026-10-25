import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./viewmodels/AuthContext";
import { PortalProvider, usePortal } from "./viewmodels/PortalContext";
import { ToastProvider } from "./viewmodels/ToastContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Conveniados from "./pages/Conveniados";
import Beneficios from "./pages/Beneficios";
import Utilizacoes from "./pages/Utilizacoes";
import Campanhas from "./pages/Campanhas";
import Relatorios from "./pages/Relatorios";
import Perfis from "./pages/Perfis";
import MeuPerfil from "./pages/MeuPerfil";
import { isAdministrador } from "./models/selectors";
function Protected() {
  const { user, restoring } = useAuth();
  if (restoring)
    return (
      <div className="loading-state" role="status">
        Verificando sessão…
      </div>
    );
  return user ? (
    <ToastProvider>
      <PortalProvider>
        <Layout />
      </PortalProvider>
    </ToastProvider>
  ) : (
    <Navigate to="/login" replace />
  );
}
function AdminPage() {
  const { user } = useAuth();
  const { data } = usePortal();
  return isAdministrador(user!, data) ? (
    <Perfis />
  ) : (
    <div className="error-state">
      <h1>Acesso restrito</h1>
      <p>A gestão de usuários e perfis é exclusiva do administrador FCV.</p>
      <Link className="btn btn-primary" to="/">
        Voltar à visão geral
      </Link>
    </div>
  );
}
function Routing() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="colaboradores" element={<Colaboradores />} />
        <Route path="beneficios" element={<Beneficios />} />
        <Route path="conveniados" element={<Conveniados />} />
        <Route path="utilizacoes" element={<Utilizacoes />} />
        <Route path="campanhas" element={<Campanhas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="perfis" element={<AdminPage />} />
        <Route path="meu-perfil" element={<MeuPerfil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </BrowserRouter>
  );
}
