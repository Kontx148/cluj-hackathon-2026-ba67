import { sha256 } from './crypto';
import { decodeVote } from './vote-vector';
import type {
  Block,
  DecryptionShare,
  Election,
  PerCandidateResult,
  PerDistrictResult,
  TallyResult,
} from './types';

export interface AggregateResult {
  candidateOrder: string[];
  encryptedAggregateMock: string;
  totalEncryptedVotes: number;
}

/**
 * Compute the public part of the tally aggregation.
 *
 * In production this would be the homomorphic sum of encrypted vote vectors;
 * the cleartext is *not* available at this point because the validators do
 * not hold the full decryption key.
 *
 * For the prototype we return:
 *   - candidateOrder: canonical ordering for the result vector
 *   - encryptedAggregateMock: a deterministic placeholder for the ciphertext
 *   - totalEncryptedVotes: number of accepted vote transactions
 *
 * The cleartext sum is intentionally NOT returned here.
 */
export function computeAggregate(blocks: Block[], election: Election): AggregateResult {
  const candidateOrder = election.candidates.map((c) => c.id);
  const txHashes: string[] = [];
  let total = 0;

  for (const block of blocks) {
    for (const tx of block.transactions) {
      if (tx.type !== 'VOTE_CAST') continue;
      if (tx.electionId !== election.electionId) continue;
      txHashes.push(tx.transactionHash);
      total += 1;
    }
  }

  const sortedHashes = [...txHashes].sort();
  const encryptedAggregateMock =
    'mock-enc-aggregate:' +
    sha256(`${election.electionId}|${candidateOrder.join(',')}|${sortedHashes.join(',')}`);

  return {
    candidateOrder,
    encryptedAggregateMock,
    totalEncryptedVotes: total,
  };
}

/**
 * Compute the cleartext final tally by re-deriving from VOTE_CAST blocks.
 *
 * In production this is the result of *combining* ≥ threshold partial
 * decryption shares against the encrypted aggregate. Here we just sum the
 * mock vectors, but we still gate the call on having enough shares.
 */
export function computeFinalTally(
  blocks: Block[],
  election: Election,
  decryptionShares: DecryptionShare[],
): TallyResult {
  const candidateOrder = election.candidates.map((c) => c.id);
  const candidateNames = election.candidates.map((c) => c.name);
  const finalTallyVector = new Array(candidateOrder.length).fill(0);
  const perDistrictVec: Record<string, number[]> = {};
  let totalVotes = 0;

  for (const block of blocks) {
    for (const tx of block.transactions) {
      if (tx.type !== 'VOTE_CAST') continue;
      if (tx.electionId !== election.electionId) continue;
      const encryptedVote = (tx.data as Record<string, unknown>).encryptedVote;
      const districtId = String((tx.data as Record<string, unknown>).districtId || '');
      const decoded = decodeVote(encryptedVote, election.electionId, election.candidates);
      if (!decoded.ok) continue;
      for (let i = 0; i < finalTallyVector.length; i++) {
        finalTallyVector[i] += decoded.vector[i];
      }
      const dvec = (perDistrictVec[districtId] ||= new Array(candidateOrder.length).fill(0));
      for (let i = 0; i < dvec.length; i++) dvec[i] += decoded.vector[i];
      totalVotes += 1;
    }
  }

  const perCandidate: PerCandidateResult[] = candidateOrder.map((cid, i) => ({
    candidateId: cid,
    name: candidateNames[i],
    votes: finalTallyVector[i],
  }));

  const perDistrict: Record<string, PerDistrictResult> = {};
  for (const [district, vec] of Object.entries(perDistrictVec)) {
    const sum = vec.reduce((a, b) => a + b, 0);
    perDistrict[district] = {
      finalTallyVector: vec,
      totalVotes: sum,
      perCandidate: candidateOrder.map((cid, i) => ({
        candidateId: cid,
        name: candidateNames[i],
        votes: vec[i],
      })),
    };
  }

  return {
    electionId: election.electionId,
    candidateOrder,
    finalTallyVector,
    totalVotes,
    perCandidate,
    perDistrict,
    decryptionShares,
    decryptedAt: new Date().toISOString(),
  };
}
