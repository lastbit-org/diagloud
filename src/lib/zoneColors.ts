export const ZONE_COLOR_IDS = [
  "slate",
  "blue",
  "green",
  "amber",
  "rose",
  "violet",
] as const;

export type ZoneColorId = (typeof ZONE_COLOR_IDS)[number];

export type ZoneColorOption = {
  id: ZoneColorId;
  label: string;
};

export const ZONE_COLOR_OPTIONS: ZoneColorOption[] = [
  { id: "slate", label: "Cinza" },
  { id: "blue", label: "Azul" },
  { id: "green", label: "Verde" },
  { id: "amber", label: "Âmbar" },
  { id: "rose", label: "Rosa" },
  { id: "violet", label: "Violeta" },
];

export function isZoneColorId(value: string): value is ZoneColorId {
  return (ZONE_COLOR_IDS as readonly string[]).includes(value);
}
