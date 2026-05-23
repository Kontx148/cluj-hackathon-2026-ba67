import { createHash } from 'crypto';

/**
 * Deterministic JSON serialization with sorted object keys.
 *
 * Required so that hashing produces the same digest regardless of the
 * order in which fields were assigned at runtime. This is a prototype
 * stand-in for the canonical encoding (e.g. RLP, CBOR, Protobuf) that a
 * production blockchain would use.
 */
export function deterministicStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value ?? null);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(deterministicStringify).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + deterministicStringify(obj[k]))
      .join(',') +
    '}'
  );
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/**
 * Hash a transaction excluding its own `transactionHash` field.
 * TODO: replace with a real cryptographic content commitment (Merkle leaf).
 */
export function hashTransaction(tx: Record<string, unknown>): string {
  const { transactionHash, ...rest } = tx;
  return sha256(deterministicStringify(rest));
}

/**
 * Hash a block over its core fields. The `blockHash` field itself is not
 * part of the digest input.
 *
 * TODO: include a Merkle root of transactions instead of the raw array.
 */
export function hashBlock(block: {
  blockNumber: number;
  previousHash: string;
  timestamp: string;
  transactions: unknown[];
  validatorSignatures: unknown[];
}): string {
  return sha256(
    deterministicStringify({
      blockNumber: block.blockNumber,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactions: block.transactions,
      validatorSignatures: block.validatorSignatures,
    }),
  );
}
