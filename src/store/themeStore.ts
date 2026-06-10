import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyTheme,
  type AccentId,
  type ColorScheme,
  isAccentId,
  isColorScheme,
  THEME_STORAGE_KEY,
} from "../lib/theme";

type ThemeState = {
  colorScheme: ColorScheme;
  accentId: AccentId;
};

type ThemeActions = {
  toggleColorScheme: () => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  setAccentId: (accentId: AccentId) => void;
};

export type ThemeStore = ThemeState & ThemeActions;

const initialState: ThemeState = {
  colorScheme: "light",
  accentId: "purple",
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleColorScheme: () => {
        const next: ColorScheme =
          get().colorScheme === "light" ? "dark" : "light";
        set({ colorScheme: next });
        applyTheme(next, get().accentId);
      },

      setColorScheme: (colorScheme) => {
        set({ colorScheme });
        applyTheme(colorScheme, get().accentId);
      },

      setAccentId: (accentId) => {
        set({ accentId });
        applyTheme(get().colorScheme, accentId);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        accentId: state.accentId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const colorScheme = isColorScheme(state.colorScheme)
          ? state.colorScheme
          : initialState.colorScheme;
        const accentId = isAccentId(state.accentId)
          ? state.accentId
          : initialState.accentId;
        applyTheme(colorScheme, accentId);
      },
    },
  ),
);

export function initTheme(): void {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) {
    applyTheme(initialState.colorScheme, initialState.accentId);
    return;
  }

  try {
    const parsed = JSON.parse(stored) as {
      state?: Partial<ThemeState>;
    };
    const colorScheme = isColorScheme(parsed.state?.colorScheme ?? "")
      ? parsed.state!.colorScheme!
      : initialState.colorScheme;
    const accentId = isAccentId(parsed.state?.accentId ?? "")
      ? parsed.state!.accentId!
      : initialState.accentId;
    applyTheme(colorScheme, accentId);
  } catch {
    applyTheme(initialState.colorScheme, initialState.accentId);
  }
}
