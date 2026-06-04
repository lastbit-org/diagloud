import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_NAMING_PATTERNS,
  type NamingPatternByKind,
  type NamingPlaceholders,
} from "../types/naming";

type NamingState = NamingPlaceholders & {
  patterns: NamingPatternByKind;
  /** Novos recursos usam os padrões após o usuário salvar. */
  isActive: boolean;
};

type NamingActions = {
  setArea: (area: string) => void;
  setAmbiente: (ambiente: string) => void;
  setPattern: (kind: keyof NamingPatternByKind, pattern: string) => void;
  saveAndActivate: () => void;
  resetToDefaults: () => void;
};

export type NamingStore = NamingState & NamingActions;

const initialNaming: NamingState = {
  area: "financeiro",
  ambiente: "prd",
  patterns: { ...DEFAULT_NAMING_PATTERNS },
  isActive: false,
};

export const useNamingStore = create<NamingStore>()(
  persist(
    (set) => ({
      ...initialNaming,

      setArea: (area) => set({ area }),
      setAmbiente: (ambiente) => set({ ambiente }),
      setPattern: (kind, pattern) =>
        set((state) => ({
          patterns: { ...state.patterns, [kind]: pattern },
        })),

      saveAndActivate: () => set({ isActive: true }),

      resetToDefaults: () =>
        set({
          patterns: { ...DEFAULT_NAMING_PATTERNS },
          area: initialNaming.area,
          ambiente: initialNaming.ambiente,
          isActive: false,
        }),
    }),
    {
      name: "diagloud-naming",
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<NamingState>),
        patterns: {
          ...DEFAULT_NAMING_PATTERNS,
          ...(persisted as Partial<NamingState> | undefined)?.patterns,
        },
      }),
      partialize: (state) => ({
        area: state.area,
        ambiente: state.ambiente,
        patterns: state.patterns,
        isActive: state.isActive,
      }),
    },
  ),
);

export function getNamingConfig(): Pick<
  NamingStore,
  "patterns" | "area" | "ambiente" | "isActive"
> {
  const { patterns, area, ambiente, isActive } = useNamingStore.getState();
  return { patterns, area, ambiente, isActive };
}
