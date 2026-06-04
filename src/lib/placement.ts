/** Desloca nós novos para não empilhar no mesmo ponto. */
export function placementOffset(index: number): { x: number; y: number } {
  const step = 40;
  const col = index % 5;
  return { x: col * step, y: col * step };
}
