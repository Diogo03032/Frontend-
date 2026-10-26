import RelatoriosView from "../components/RelatoriosView";
import { useRelatoriosVM } from "../viewmodels/useRelatoriosVM";

export default function Relatorios() {
  return <RelatoriosView {...useRelatoriosVM()} />;
}