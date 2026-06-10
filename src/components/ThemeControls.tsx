import { useEffect, useRef, useState } from "react";
import { ACCENT_PRESETS, resolveAccentHex } from "../lib/theme";
import { useThemeStore } from "../store/themeStore";
import "./theme-controls.css";

export function ThemeControls() {
  const colorScheme = useThemeStore((s) => s.colorScheme);
  const accentId = useThemeStore((s) => s.accentId);
  const toggleColorScheme = useThemeStore((s) => s.toggleColorScheme);
  const setAccentId = useThemeStore((s) => s.setAccentId);

  const accentMenuRef = useRef<HTMLDivElement>(null);
  const [accentOpen, setAccentOpen] = useState(false);

  useEffect(() => {
    if (!accentOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!accentMenuRef.current?.contains(event.target as Node)) {
        setAccentOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [accentOpen]);

  const currentAccent = resolveAccentHex(accentId, colorScheme);
  const isDark = colorScheme === "dark";

  return (
    <div className="theme-controls" aria-label="Aparência">
      <button
        type="button"
        className="theme-controls__btn"
        onClick={toggleColorScheme}
        title={isDark ? "Tema claro" : "Tema escuro"}
        aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      >
        <span className="theme-controls__icon" aria-hidden>
          {isDark ? "☀" : "☾"}
        </span>
      </button>

      <div className="theme-controls__accent" ref={accentMenuRef}>
        <button
          type="button"
          className="theme-controls__btn theme-controls__btn--accent"
          onClick={() => setAccentOpen((open) => !open)}
          aria-expanded={accentOpen}
          aria-haspopup="listbox"
          title="Cor de destaque"
          aria-label="Escolher cor de destaque"
        >
          <span
            className="theme-controls__swatch"
            style={{ backgroundColor: currentAccent }}
            aria-hidden
          />
        </button>

        {accentOpen && (
          <ul
            className="theme-controls__menu"
            role="listbox"
            aria-label="Cores de destaque"
          >
            {ACCENT_PRESETS.map((preset) => {
              const swatch = resolveAccentHex(preset.id, colorScheme);
              const selected = preset.id === accentId;
              return (
                <li key={preset.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`theme-controls__option${selected ? " theme-controls__option--selected" : ""}`}
                    onClick={() => {
                      setAccentId(preset.id);
                      setAccentOpen(false);
                    }}
                  >
                    <span
                      className="theme-controls__option-swatch"
                      style={{ backgroundColor: swatch }}
                      aria-hidden
                    />
                    <span>{preset.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
