import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PortalData, Resource, Entity } from "../models/types";
import { createDemoData } from "../models/demoData";
import { isAdministrador } from "../models/selectors";
import { listResource, saveResource } from "../services/api";
import { useAuth } from "./AuthContext";
const key = "fcv.portal.demo.v1";
const empty: PortalData = {
  usuarios: [],
  perfis: [],
  colaboradores: [],
  conveniados: [],
  beneficios: [],
  ofertas: [],
  campanhas: [],
  itensCampanha: [],
  ofertasCampanha: [],
  utilizacoes: [],
};
type Toast = { message: string; type: "success" | "error" | "info" };
interface Portal {
  data: PortalData;
  mode: "demo" | "api";
  loading: boolean;
  error: string | null;
  toast: Toast | null;
  notify: (message: string, type?: Toast["type"]) => void;
  reload: () => Promise<void>;
  save: <K extends Resource>(
    resource: K,
    id: number | undefined,
    payload: Partial<Entity<K>>,
  ) => Promise<Entity<K>>;
  resetDemo: () => void;
}
const Context = createContext<Portal | null>(null);
export function PortalProvider({ children }: { children: ReactNode }) {
  const { mode, user } = useAuth();
  const [data, setData] = useState<PortalData>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [toast, setToast] = useState<Toast | null>(null);
  const dataRef = useRef(data);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  dataRef.current = data;
  function notify(message: string, type: Toast["type"] = "success") {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setToast({ message, type });
    noticeTimer.current = setTimeout(() => setToast(null), 5000);
  }
  async function reload() {
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    if (mode === "demo") {
      let value: PortalData;
      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : null;
        value =
          parsed && Object.keys(empty).every((k) => Array.isArray(parsed[k]))
            ? parsed
            : createDemoData();
      } catch {
        value = createDemoData();
      }
      setData(value);
      dataRef.current = value;
      setLoading(false);
      return;
    }
    const resources = Object.keys(empty) as Resource[];
    try {
      const results = await Promise.all(resources.map((r) => listResource(r)));
      if (current !== generation.current) return;
      const next = Object.fromEntries(
        resources.map((r, i) => [r, results[i]]),
      ) as unknown as PortalData;
      setData(next);
      dataRef.current = next;
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e.message : "Falha ao carregar dados.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [mode, user?.id]);
  async function save<K extends Resource>(
    resource: K,
    id: number | undefined,
    payload: Partial<Entity<K>>,
  ): Promise<Entity<K>> {
    if (!user) throw new Error("Faça login para continuar.");
    if (
      (resource === "usuarios" || resource === "perfis") &&
      !isAdministrador(user, dataRef.current)
    )
      throw new Error(
        "Somente o administrador pode alterar usuários e perfis.",
      );
    if (resource === "utilizacoes") {
      const previous = dataRef.current.utilizacoes.find((u) => u.id === id);
      const update = payload as Partial<PortalData["utilizacoes"][number]>;
      if (
        !previous ||
        previous.status !== "APROVADA" ||
        update.status !== "ESTORNADA" ||
        !update.observacoes?.trim()
      )
        throw new Error(
          "Só é permitido estornar uma utilização aprovada, informando o motivo.",
        );
      if (
        Object.keys(update).some((k) => !["status", "observacoes"].includes(k))
      )
        throw new Error("O histórico de utilização não pode ser editado.");
    }
    let result: Entity<K>;
    if (mode === "api") {
      result = await saveResource(resource, id, payload);
    } else {
      const sanitized = { ...payload } as Record<string, unknown>;
      delete sanitized.senha;
      const previous = dataRef.current[resource].find((item) => item.id === id);
      if (id !== undefined && !previous)
        throw new Error("Registro não encontrado.");
      const nextId =
        id ??
        Math.max(0, ...dataRef.current[resource].map((item) => item.id)) + 1;
      result = { ...previous, ...sanitized, id: nextId } as Entity<K>;
    }
    const currentData = dataRef.current;
    const rows = currentData[resource] as Entity<K>[];
    const next = {
      ...currentData,
      [resource]:
        id === undefined
          ? [...rows, result]
          : rows.map((item) => (item.id === id ? result : item)),
    } as PortalData;
    dataRef.current = next;
    setData(next);
    if (mode === "demo") {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        notify(
          "A alteração está nesta sessão; não foi possível salvar a demonstração no navegador.",
          "info",
        );
      }
    }
    return result;
  }
  function resetDemo() {
    if (mode !== "demo") return;
    localStorage.removeItem(key);
    const next = createDemoData();
    setData(next);
    dataRef.current = next;
    notify("Dados de demonstração restaurados.");
  }
  return (
    <Context.Provider
      value={{
        data,
        mode,
        loading,
        error,
        toast,
        notify,
        reload,
        save,
        resetDemo,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePortal = () => {
  const c = useContext(Context);
  if (!c) throw new Error("PortalProvider ausente");
  return c;
};
