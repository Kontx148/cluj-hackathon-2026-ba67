import type { Candidate } from './types';

export type DecodeResult =
  | { ok: true; vector: number[] }
  | { ok: false; error: string };

/**
 * Decode a mock-encrypted vote into a one-hot vector matching the order of
 * `candidates`.
 *
 * Three formats are supported:
 *
 *   1. `mock-enc:<electionId>:[1,0,0]`        ← preferred, bound to election
 *   2. `mock-encrypted-vector:[1,0,0]`        ← legacy vector form
 *   3. `mock-encrypted:<candidateId>`         ← legacy single-candidate form
 *
 * A valid vote vector must:
 *   - have length equal to candidate count
 *   - contain only 0 or 1
 *   - sum to exactly 1
 *
 * TODO: replace with real homomorphic ciphertext decoding (threshold
 * ElGamal / Paillier). The "vector" is a stand-in for the cleartext
 * underlying the ciphertext that homomorphic aggregation would compute.
 */
export function decodeVote(
  encryptedVote: unknown,
  electionId: string,
  candidates: Candidate[],
): DecodeResult {
  if (typeof encryptedVote !== 'string' || encryptedVote.length === 0) {
    return { ok: false, error: 'encryptedVote must be a non-empty string' };
  }
  const n = candidates.length;

  if (encryptedVote.startsWith('mock-enc:')) {
    const rest = encryptedVote.slice('mock-enc:'.length);
    const colonIdx = rest.indexOf(':');
    if (colonIdx < 0) {
      return { ok: false, error: 'mock-enc format must be mock-enc:<electionId>:[..]' };
    }
    const innerEid = rest.slice(0, colonIdx);
    if (innerEid !== electionId) {
      return {
        ok: false,
        error: `electionId in encryptedVote (${innerEid}) does not match request electionId (${electionId})`,
      };
    }
    const vector = parseVectorJson(rest.slice(colonIdx + 1));
    if (!vector) return { ok: false, error: 'invalid vote vector JSON' };
    return validateVector(vector, n);
  }

  if (encryptedVote.startsWith('mock-encrypted-vector:')) {
    const vector = parseVectorJson(encryptedVote.slice('mock-encrypted-vector:'.length));
    if (!vector) return { ok: false, error: 'invalid vote vector JSON' };
    return validateVector(vector, n);
  }

  if (encryptedVote.startsWith('mock-encrypted:')) {
    const candidateId = encryptedVote.slice('mock-encrypted:'.length);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx < 0) return { ok: false, error: `unknown candidate id: ${candidateId}` };
    const vector = new Array(n).fill(0);
    vector[idx] = 1;
    return { ok: true, vector };
  }

  return {
    ok: false,
    error:
      'unknown encryptedVote format (expected mock-enc:..., mock-encrypted-vector:..., or mock-encrypted:...)',
  };
}

function parseVectorJson(s: string): number[] | null {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'number')) return null;
    return v as number[];
  } catch {
    return null;
  }
}

function validateVector(vector: number[], candidateCount: number): DecodeResult {
  if (vector.length !== candidateCount) {
    return {
      ok: false,
      error: `vote vector length must equal candidate count (${candidateCount}); got ${vector.length}`,
    };
  }
  if (!vector.every((x) => x === 0 || x === 1)) {
    return { ok: false, error: 'vote vector entries must be 0 or 1' };
  }
  const sum = vector.reduce<number>((a, b) => a + b, 0);
  if (sum !== 1) {
    return { ok: false, error: `vote vector sum must equal 1; got ${sum}` };
  }
  return { ok: true, vector };
}
