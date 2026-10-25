import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
interface Portal {
  data: PortalData;
  loading: boolean;
  error: string | null;
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
    [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const generation = useRef(0);
  dataRef.current = data;
  const userRef = useRef(user);
  userRef.current = user;
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    if (isLocalDemoUser(userRef.current)) {
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
  }, []);
  useEffect(() => {
    void reload();
    return () => {
      generation.current++;
    };
  }, [user?.id]);
  const save = useCallback(async function save<K extends Resource>(
    resource: K,
    id: number | undefined,
    payload: Partial<Entity<K>>,
  ): Promise<Entity<K>> {
    const u = userRef.current;
    if (!u) throw new Error("Faça login para continuar.");
    if (
      (resource === "usuarios" || resource === "perfis") &&
      !isAdministrador(u, dataRef.current)
    )
      throw new Error(
        "Somente o administrador pode alterar usuários e perfis.",
      );
    if (resource === "utilizacoes") {
      const previous = dataRef.current.utilizacoes.find((x) => x.id === id);
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
    const result = isLocalDemoUser(u)
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
  }, []);
  const value = useMemo<Portal>(
    () => ({ data, loading, error, reload, save }),
    [data, loading, error, reload, save],
  );
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}
export const usePortal = () => {
  const c = useContext(Context);
  if (!c) throw new Error("PortalProvider ausente");
  return c;
};
