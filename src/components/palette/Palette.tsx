import "./palette.css";
import { PaletteItem } from "./PaletteItem";
import { PALETTE_ITEMS } from "./paletteItems";

export function Palette() {
  return (
    <aside className="palette" aria-label="Recursos GCP">
      <h2 className="palette__title">Recursos</h2>
      <p className="palette__hint">
        Clique ou arraste para o diagrama.
      </p>
      <ul className="palette__list">
        {PALETTE_ITEMS.map((item) => (
          <PaletteItem key={item.kind} item={item} />
        ))}
      </ul>
    </aside>
  );
}
