import type { Resource, SessionUser, Entity } from "../models/types";
const configured =
  import.meta.env.VITE_API_URL || "http://localhost:3333/api/v1";
export const API_URL = configured.replace(/\/$/, "");
let token = sessionStorage.getItem("fcv.session.token");
export function setToken(value: string | null) {
  token = value;
  if (value) sessionStorage.setItem("fcv.session.token", value);
  else sessionStorage.removeItem("fcv.session.token");
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const endpoints: Record<Resource, string> = {
  usuarios: "usuarios",
  perfis: "perfis",
  colaboradores: "colaboradores",
  conveniados: "conveniados",
  beneficios: "beneficios",
  ofertas: "ofertas",
  campanhas: "campanhas",
  itensCampanha: "itens-campanha",
  ofertasCampanha: "ofertas-campanha",
  utilizacoes: "utilizacoes",
};
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o serviço está disponível.",
      0,
    );
  }
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(
      "A API retornou uma resposta inesperada.",
      response.status,
    );
  }
  if (!response.ok) {
    if (response.status === 401 && path != "/auth/login") {
      setToken(null);
      window.dispatchEvent(new Event("fcv:unauthorized"));
    }
    throw new ApiError(
      (data as { erro?: string })?.erro ||
        "Não foi possível concluir a solicitação.",
      response.status,
    );
  }
  return data as T;
}
export async function loginApi(email: string, senha: string) {
  const result = await request<{ token: string; usuario: SessionUser }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, senha }) },
  );
  if (result.usuario.escopo !== "FCV" || result.usuario.status !== "ATIVO")
    throw new ApiError(
      "Este portal é exclusivo da equipe ativa da Fundação FCV.",
      403,
    );
  setToken(result.token);
  return result.usuario;
}
export const getCurrentUser = () => request<SessionUser>("/auth/eu");
export const hasToken = () => Boolean(token);
export function listResource<K extends Resource>(
  resource: K,
  signal?: AbortSignal,
) {
  return request<Entity<K>[]>(`/${endpoints[resource]}`, { signal });
}
export function saveResource<K extends Resource>(
  resource: K,
  id: number | undefined,
  payload: Partial<Entity<K>>,
) {
  return request<Entity<K>>(
    `/${endpoints[resource]}${id !== undefined ? `/${id}` : ""}`,
    {
      method: id !== undefined ? "PUT" : "POST",
      body: JSON.stringify(payload),
    },
  );
}
