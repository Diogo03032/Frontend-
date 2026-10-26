import PasswordRecoveryView from "../components/PasswordRecoveryView";
import { usePasswordRecoveryVM } from "../viewmodels/usePasswordRecoveryVM";

export default function PasswordRecovery(props: {
  onBack: () => void;
  defaultEmail?: string;
}) {
  const viewModel = usePasswordRecoveryVM(props);
  return <PasswordRecoveryView {...viewModel} />;
}
