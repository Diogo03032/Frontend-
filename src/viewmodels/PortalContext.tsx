import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PortalData, Resource, Entity } from "../models/types";
import { isAdministrador } from "../models/selectors";
import { listResource, saveResource } from "../services/api";
import {
  createLocalDemoData,
  isLocalDemoUser,
  saveLocalDemoEntity,
} from "../local-demo/localDemo";
import { useAuth } from "./AuthContext";
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
}
const Context = createContext<Portal | null>(null);
export function PortalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
    if (isLocalDemoUser(user)) {
      const next = createLocalDemoData();
      setData(next);
      dataRef.current = next;
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
  }, [user?.id]);
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
    const currentData = dataRef.current;
    const rows = currentData[resource] as Entity<K>[];
    const result = isLocalDemoUser(user)
      ? saveLocalDemoEntity(rows, id, payload)
      : await saveResource(resource, id, payload);
    const next = {
      ...currentData,
      [resource]:
        id === undefined
          ? [...rows, result]
          : rows.map((item) => (item.id === id ? result : item)),
    } as PortalData;
    dataRef.current = next;
    setData(next);
    return result;
  }
  return (
    <Context.Provider
      value={{
        data,
        loading,
        error,
        toast,
        notify,
        reload,
        save,
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
