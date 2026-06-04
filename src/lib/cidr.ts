/** IPs reservados pelo GCP no início e fim de cada sub-rede. */
export const GCP_SUBNET_RESERVED_HEAD = 4;
export const GCP_SUBNET_RESERVED_TAIL = 1;

export type ParsedCidr = {
  cidr: string;
  network: number;
  prefix: number;
  mask: number;
  start: number;
  end: number;
};

export function parseIPv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    value = (value << 8) + octet;
  }
  return value >>> 0;
}

export function formatIPv4(value: number): string {
  const n = value >>> 0;
  return [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
  ].join(".");
}

export function parseCidr(cidr: string): ParsedCidr | null {
  const trimmed = cidr.trim();
  const match = trimmed.match(
    /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/,
  );
  if (!match) return null;

  const networkIp = parseIPv4(match[1]);
  const prefix = Number(match[2]);
  if (networkIp === null || prefix < 8 || prefix > 29) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = networkIp & mask;
  const end = (network | ~mask) >>> 0;

  if (networkIp !== network) return null;

  return {
    cidr: `${formatIPv4(network)}/${prefix}`,
    network,
    prefix,
    mask,
    start: network,
    end,
  };
}

export function cidrsOverlap(a: string, b: string): boolean {
  const parsedA = parseCidr(a);
  const parsedB = parseCidr(b);
  if (!parsedA || !parsedB) return false;
  return parsedA.start <= parsedB.end && parsedB.start <= parsedA.end;
}

export function countUsableHostAddresses(parsed: ParsedCidr): number {
  const total = parsed.end - parsed.start + 1;
  return Math.max(0, total - GCP_SUBNET_RESERVED_HEAD - GCP_SUBNET_RESERVED_TAIL);
}

export function maxVmsForCidr(cidr: string): number {
  const parsed = parseCidr(cidr);
  if (!parsed) return 0;
  return countUsableHostAddresses(parsed);
}

export function getUsableHostAddress(cidr: string, index: number): string | null {
  const parsed = parseCidr(cidr);
  if (!parsed || index < 0) return null;

  const offset = GCP_SUBNET_RESERVED_HEAD + index;
  const total = parsed.end - parsed.start + 1;
  const hostIndex = parsed.start + offset;
  if (offset + GCP_SUBNET_RESERVED_TAIL >= total) return null;

  return formatIPv4(hostIndex);
}

export function suggestSubnetCidr(existingCidrs: string[]): string {
  for (let third = 0; third < 256; third += 1) {
    const candidate = `10.0.${third}.0/24`;
    if (!existingCidrs.some((cidr) => cidrsOverlap(candidate, cidr))) {
      return candidate;
    }
  }
  return "10.10.0.0/24";
}
