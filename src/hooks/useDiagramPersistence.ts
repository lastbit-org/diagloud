import { useEffect, useRef } from "react";
import {
  DIAGRAM_STORAGE_KEY,
  parseDiagramDocument,
  serializeDiagramDocument,
} from "../lib/diagramDocument";
import { useDiagramStore } from "../store/diagramStore";
import { useNamingStore } from "../store/namingStore";

/** Carrega do localStorage na montagem e persiste alterações (round-trip). */
export function useDiagramPersistence() {
  const hydratedRef = useRef(false);

  useEffect(() => {
    const loadFromStorage = () => {
      const raw = localStorage.getItem(DIAGRAM_STORAGE_KEY);
      if (raw) {
        try {
          const document = parseDiagramDocument(raw);
          useDiagramStore.getState().loadDocument(document);
        } catch {
          localStorage.removeItem(DIAGRAM_STORAGE_KEY);
        }
      }
      hydratedRef.current = true;
    };

    if (useNamingStore.persist.hasHydrated()) {
      loadFromStorage();
      return;
    }

    return useNamingStore.persist.onFinishHydration(loadFromStorage);
  }, []);

  useEffect(() => {
    return useDiagramStore.subscribe((state, previous) => {
      if (!hydratedRef.current) return;
      if (state.nodes === previous.nodes && state.edges === previous.edges) {
        return;
      }
      const document = useDiagramStore.getState().getDocument();
      localStorage.setItem(DIAGRAM_STORAGE_KEY, serializeDiagramDocument(document));
    });
  }, []);
}
