import { useEffect, useRef } from "react";
import { parseEntityId } from "../models/detailSelectors";

/** Open an existing page action once after following a detail-page link. */
export function useInitialAction(actions: Record<string, (id: number) => void>) {
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    for (const [key, action] of Object.entries(actions)) {
      const id = parseEntityId(params.get(key));
      if (id !== null) {
        action(id);
        break;
      }
    }
  }, [actions]);
}
