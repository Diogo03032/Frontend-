interface LocalDemoAccessButtonProps {
  disabled: boolean;
  onAccess: () => void;
}

export default function LocalDemoAccessButton({
  disabled,
  onAccess,
}: LocalDemoAccessButtonProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <button
      className="btn btn-secondary login-submit"
      type="button"
      disabled={disabled}
      onClick={onAccess}
    >
      Acessar perfil local de demonstração
    </button>
  );
}