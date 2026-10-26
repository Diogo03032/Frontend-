import { useAuth } from "./AuthContext";
import { usePortal } from "./PortalContext";
import { capitalizeFirstLetter, formatDate, initials } from "../models/selectors";

const roleLabels: Record<string, string> = {
  FCV_ADMINISTRADOR: "Administrador FCV",
  FCV_OPERADOR: "Operador FCV",
};

export function useMeuPerfilVM() {
  const { user } = useAuth();
  const { data } = usePortal();
  const account = data.usuarios.find((item) => item.id === user!.id) ?? user!;
  const profile = data.perfis.find((item) => item.id === account.perfil_id);
  const profileName = profile?.nome ?? user!.perfil;

  return {
    account,
    profile,
    role: roleLabels[profileName] ?? profileName,
    name: capitalizeFirstLetter(account.nome),
    avatar: initials(account.nome),
    createdAt: formatDate(account.data_criacao),
  };
}