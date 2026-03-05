/**
 * Check whether an IPv4 address is contained within a CIDR range or matches exactly.
 * Supports both exact addresses ("192.168.1.1") and CIDR notation ("192.168.1.0/24").
 * Returns false for invalid inputs (does not throw).
 */
export function cidrContains(cidr: string, ip: string): boolean {
  try {
    if (!cidr.includes('/')) {
      // Exact match
      return cidr.trim() === ip.trim();
    }
    const [networkPart, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const networkInt = ipToInt(networkPart.trim());
    const ipInt = ipToInt(ip.trim());
    if (networkInt === null || ipInt === null) return false;

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (networkInt & mask) === (ipInt & mask);
  } catch {
    return false;
  }
}

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

/**
 * Check whether an IP is within any entry of the allowlist.
 * allowlist entries have shape { cidr: string, label?: string }.
 * Empty allowlist returns true (no restriction).
 */
export function ipInAllowlist(allowlist: Array<{ cidr: string; label?: string }>, ip: string): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  return allowlist.some((entry) => cidrContains(entry.cidr, ip));
}
