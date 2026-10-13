import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "../models/types";
import { getCurrentUser, hasToken, loginApi, setToken } from "../services/api";
export const demoEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";
interface Auth {
  user: SessionUser | null;
  mode: "demo" | "api";
  restoring: boolean;
  login: (email: string, senha: string) => Promise<void>;
  demo: (role?: "admin" | "operador") => void;
  logout: () => void;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null),
    [mode, setMode] = useState<"demo" | "api">("api"),
    [restoring, setRestoring] = useState(hasToken());
  function logout() {
    setToken(null);
    setUser(null);
    setMode("api");
  }
  useEffect(() => {
    let active = true;
    if (hasToken())
      getCurrentUser()
        .then((u) => {
          if (!active) return;
          if (u.escopo === "FCV" && u.status === "ATIVO") setUser(u);
          else setToken(null);
        })
        .catch(() => setToken(null))
        .finally(() => {
          if (active) setRestoring(false);
        });
    const expire = () => logout();
    window.addEventListener("fcv:unauthorized", expire);
    return () => {
      active = false;
      window.removeEventListener("fcv:unauthorized", expire);
    };
  }, []);
  async function login(email: string, senha: string) {
    const u = await loginApi(email, senha);
    setMode("api");
    setUser(u);
  }
  function demo(role: "admin" | "operador" = "admin") {
    if (!demoEnabled) return;
    setToken(null);
    setMode("demo");
    setUser({
      id: role === "admin" ? 1 : 2,
      nome: role === "admin" ? "Ana Beatriz Santos" : "Bruno Operador",
      email: role === "admin" ? "admin@fcv.org.br" : "operador@fcv.org.br",
      perfil_id: role === "admin" ? 1 : 2,
      perfil: role === "admin" ? "FCV_ADMINISTRADOR" : "FCV_OPERADOR",
      status: "ATIVO",
      escopo: "FCV",
    });
  }
  return (
    <Context.Provider value={{ user, mode, restoring, login, demo, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => {
  const c = useContext(Context);
  if (!c) throw new Error("AuthProvider ausente");
  return c;
};
