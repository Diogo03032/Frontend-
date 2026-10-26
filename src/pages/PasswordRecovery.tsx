import PasswordRecoveryView from "../components/PasswordRecoveryView";
import { usePasswordRecoveryVM } from "../viewmodels/usePasswordRecoveryVM";

export default function PasswordRecovery(props: { onBack: () => void; defaultEmail?: string }) {
  return <PasswordRecoveryView {...usePasswordRecoveryVM(props)} />;
}
