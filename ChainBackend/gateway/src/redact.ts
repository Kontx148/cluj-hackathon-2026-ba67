export function redactPrivateElectionKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactPrivateElectionKeys(item)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'electionPrivateKey') continue;
      out[key] = redactPrivateElectionKeys(child);
    }
    return out as T;
  }
  return value;
}
