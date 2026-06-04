import "./palette.css";
import { PaletteItem } from "./PaletteItem";
import { PALETTE_CATEGORIES, paletteItemsByCategory } from "./paletteItems";

export function Palette() {
  return (
    <aside className="palette" aria-label="Recursos GCP">
      <h2 className="palette__title">Recursos</h2>
      <p className="palette__hint">
        Categorias como no{" "}
        <a
          href="https://console.cloud.google.com/products"
          target="_blank"
          rel="noopener noreferrer"
          className="palette__hint-link"
        >
          console GCP
        </a>
        . Clique ou arraste para o diagrama.
      </p>
      <div className="palette__groups">
        {PALETTE_CATEGORIES.map((category) => {
          const items = paletteItemsByCategory(category.id);
          if (items.length === 0) return null;

          return (
            <section
              key={category.id}
              className="palette__group"
              aria-labelledby={`palette-category-${category.id}`}
            >
              <h3
                id={`palette-category-${category.id}`}
                className="palette__group-title"
              >
                {category.label}
              </h3>
              <ul className="palette__list">
                {items.map((item) => (
                  <PaletteItem key={item.kind} item={item} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
