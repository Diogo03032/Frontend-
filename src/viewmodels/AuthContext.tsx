import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "../models/types";
import { getCurrentUser, hasToken, loginApi, setToken } from "../services/api";
import {
  clearLocalDemoSession,
  hasLocalDemoSession,
  localDemoUser,
  startLocalDemoSession,
} from "../local-demo/localDemo";
interface Auth {
  user: SessionUser | null;
  restoring: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginLocal: () => void;
  logout: () => void;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
      hasLocalDemoSession() ? localDemoUser : null,
    ),
    [restoring, setRestoring] = useState(
      () => !hasLocalDemoSession() && hasToken(),
    );
  const logout = useCallback(() => {
    clearLocalDemoSession();
    setToken(null);
    setUser(null);
  }, []);
  useEffect(() => {
    let active = true;
    if (hasLocalDemoSession()) setRestoring(false);
    else if (hasToken())
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
  const login = useCallback(async (email: string, senha: string) => {
    clearLocalDemoSession();
    const u = await loginApi(email, senha);
    setUser(u);
  }, []);
  const loginLocal = useCallback(() => {
    if (!startLocalDemoSession()) return;
    setToken(null);
    setUser(localDemoUser);
  }, []);
  const value = useMemo<Auth>(
    () => ({ user, restoring, login, loginLocal, logout }),
    [user, restoring, login, loginLocal, logout],
  );
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => {
  const c = useContext(Context);
  if (!c) throw new Error("AuthProvider ausente");
  return c;
};
