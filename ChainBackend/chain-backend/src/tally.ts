import { storage } from './storage';
import type { TallyResult, VoteTransaction } from './types';

/**
 * Mocked tallying.
 *
 * Real elections would tally homomorphically encrypted ballots without
 * decrypting individual votes (Paillier / threshold ElGamal) and only
 * decrypt the aggregate using a threshold-key ceremony shared between
 * institutions.
 *
 * For the prototype each `encryptedVote` has the format
 *   `mock-encrypted:<candidateId>`
 * which we simply parse and count.
 *
 * TODO: replace with homomorphic aggregation + threshold decryption.
 */
export function computeMockTally(electionId: string): TallyResult {
  const perCandidate: Record<string, number> = {};
  const perDistrict: Record<string, Record<string, number>> = {};
  let totalVotes = 0;

  for (const block of storage.state.blocks) {
    for (const tx of block.transactions) {
      if (tx.type !== 'VOTE_CAST') continue;
      if (tx.electionId !== electionId) continue;

      const vote = tx as VoteTransaction;
      const enc = vote.encryptedVote || '';
      const prefix = 'mock-encrypted:';
      if (!enc.startsWith(prefix)) continue;
      const candidate = enc.slice(prefix.length);
      if (!candidate) continue;

      perCandidate[candidate] = (perCandidate[candidate] || 0) + 1;
      const districtBucket = (perDistrict[vote.districtId] ||= {});
      districtBucket[candidate] = (districtBucket[candidate] || 0) + 1;
      totalVotes += 1;
    }
  }

  return {
    electionId,
    totalVotes,
    perCandidate,
    perDistrict,
    computedAt: new Date().toISOString(),
  };
}
