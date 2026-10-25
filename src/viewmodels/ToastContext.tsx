import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = { message: string; type: "success" | "error" | "info" };

interface ToastCtx {
  toast: Toast | null;
  notify: (message: string, type?: Toast["type"]) => void;
}

const Context = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      timer.current = setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const value = useMemo<ToastCtx>(
    () => ({ toast, notify }),
    [toast, notify],
  );

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export const useToast = () => {
  const c = useContext(Context);
  if (!c) throw new Error("ToastProvider ausente");
  return c;
};
