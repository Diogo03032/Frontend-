import type { Entity, PortalData, Resource, SessionUser } from "../models/types";
import { createFixtureData } from "../../tests/fixtures/portalData";

const sessionKey = "fcv.local.demo";

export const localDemoEnabled = import.meta.env.DEV;
export const localDemoUser: SessionUser = {
  id: 0,
  nome: "Administrador local",
  email: "local@fcv.test",
  perfil_id: 1,
  perfil: "FCV_ADMINISTRADOR",
  escopo: "FCV",
  status: "ATIVO",
  data_criacao: new Date().toISOString(),
};

export function hasLocalDemoSession() {
  return localDemoEnabled && sessionStorage.getItem(sessionKey) === "true";
}

export function startLocalDemoSession() {
  if (!localDemoEnabled) return false;
  sessionStorage.setItem(sessionKey, "true");
  return true;
}

export function clearLocalDemoSession() {
  sessionStorage.removeItem(sessionKey);
}

export function isLocalDemoUser(user: SessionUser | null) {
  return localDemoEnabled && user?.id === localDemoUser.id;
}

export function createLocalDemoData(): PortalData {
  return createFixtureData();
}

export function saveLocalDemoEntity<K extends Resource>(
  rows: Entity<K>[],
  id: number | undefined,
  payload: Partial<Entity<K>>,
): Entity<K> {
  if (id === undefined) {
    return {
      ...payload,
      id: Math.max(0, ...rows.map((item) => item.id)) + 1,
    } as Entity<K>;
  }
  return {
    ...rows.find((item) => item.id === id),
    ...payload,
  } as Entity<K>;
}