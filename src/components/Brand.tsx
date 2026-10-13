export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label="Fundação Cristiano Varella"
    >
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="12" r="10" />
        <path d="M1 25l9-8 18 13 18-13 9 8-19 16v14H20V41z" />
      </svg>
      <strong>FCV</strong>
      <span>
        Fundação
        <br />
        Cristiano Varella<small>Pela vida.</small>
      </span>
    </div>
  );
}
