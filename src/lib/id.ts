export function createId(prefix = "node"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
