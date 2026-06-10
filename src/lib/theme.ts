export const THEME_STORAGE_KEY = "diagloud-theme";

export type ColorScheme = "light" | "dark";

export type AccentId =
  | "purple"
  | "blue"
  | "green"
  | "orange"
  | "teal"
  | "rose";

export type AccentPreset = {
  id: AccentId;
  label: string;
  light: string;
  dark: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "purple", label: "Roxo", light: "#aa3bff", dark: "#c084fc" },
  { id: "blue", label: "Azul", light: "#2563eb", dark: "#60a5fa" },
  { id: "green", label: "Verde", light: "#16a34a", dark: "#4ade80" },
  { id: "orange", label: "Laranja", light: "#ea580c", dark: "#fb923c" },
  { id: "teal", label: "Turquesa", light: "#0d9488", dark: "#2dd4bf" },
  { id: "rose", label: "Rosa", light: "#e11d48", dark: "#fb7185" },
];

export function isAccentId(value: string): value is AccentId {
  return ACCENT_PRESETS.some((preset) => preset.id === value);
}

export function isColorScheme(value: string): value is ColorScheme {
  return value === "light" || value === "dark";
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function resolveAccentHex(
  accentId: AccentId,
  colorScheme: ColorScheme,
): string {
  const preset =
    ACCENT_PRESETS.find((item) => item.id === accentId) ?? ACCENT_PRESETS[0];
  return colorScheme === "dark" ? preset.dark : preset.light;
}

export function applyTheme(
  colorScheme: ColorScheme,
  accentId: AccentId,
): void {
  const root = document.documentElement;
  root.dataset.theme = colorScheme;

  const hex = resolveAccentHex(accentId, colorScheme);
  const { r, g, b } = parseHex(hex);
  const accentBgAlpha = colorScheme === "dark" ? 0.15 : 0.1;

  root.style.setProperty("--accent", hex);
  root.style.setProperty(
    "--accent-bg",
    `rgba(${r}, ${g}, ${b}, ${accentBgAlpha})`,
  );
  root.style.setProperty("--accent-border", `rgba(${r}, ${g}, ${b}, 0.5)`);
  root.style.colorScheme = colorScheme;
}
