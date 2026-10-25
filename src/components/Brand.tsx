import logo from "../images/base-images/logofcv_blue.svg";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <img src={logo} width={2560} height={468} decoding="async" alt="FCV — Fundação Cristiano Varella. Pela vida." />
  </div>;
}
