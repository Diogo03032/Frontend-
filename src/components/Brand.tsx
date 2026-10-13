export default function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <img src="/referencia-web/fcv-logo.webp" width={544} height={106} decoding="async" alt="FCV — Fundação Cristiano Varella. Pela vida." />
  </div>;
}
