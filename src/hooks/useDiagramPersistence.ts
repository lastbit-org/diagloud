import { useEffect, useRef } from "react";
import {
  loadDiagramFromLocalStorage,
  saveDiagramToLocalStorage,
} from "../lib/diagramPersistence";
import { useDiagramStore } from "../store/diagramStore";
import { useNamingStore } from "../store/namingStore";

const AUTOSAVE_DEBOUNCE_MS = 400;

/**
 * Autosave no localStorage (`diagloud-diagram`) e restauração ao recarregar a página.
 */
export function useDiagramPersistence() {
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const hydrate = () => {
      loadDiagramFromLocalStorage();
      hydratedRef.current = true;
    };

    if (useNamingStore.persist.hasHydrated()) {
      hydrate();
      return;
    }

    return useNamingStore.persist.onFinishHydration(hydrate);
  }, []);

  useEffect(() => {
    const scheduleSave = () => {
      if (!hydratedRef.current) return;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveDiagramToLocalStorage();
        saveTimerRef.current = null;
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    return useDiagramStore.subscribe((state, previous) => {
      if (state.nodes === previous.nodes && state.edges === previous.edges) {
        return;
      }
      scheduleSave();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);
}
