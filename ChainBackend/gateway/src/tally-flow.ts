import { createHash } from 'crypto';
import { config } from './config';
import { runConsensus, type ConsensusResult } from './consensus';
import { broadcastPost } from './validators-client';
import type { DecryptionShareResponse } from './types';

export interface TallyAggregateResponse {
  electionId: string;
  status: 'TALLYING';
  threshold: number;
  candidateOrder: string[];
  encryptedAggregateMock: string;
  totalEncryptedVotes: number;
  consensus: ConsensusResult;
  note: string;
}

/**
 * POST /elections/:id/tally
 *
 * Drives the homomorphic-aggregation step. Validators are asked to
 * compute the encrypted aggregate against their own chains; the gateway
 * picks the majority result and commits an ELECTION_TALLY_AGGREGATED
 * block. No cleartext is exposed at this stage.
 */
export async function aggregateTally(electionId: string): Promise<
  | { ok: true; response: TallyAggregateResponse }
  | { ok: false; status: number; error: string; consensus?: ConsensusResult }
> {
  const consensus = await runConsensus({
    type: 'ELECTION_TALLY_AGGREGATED',
    electionId,
    data: {},
  });
  if (!consensus.ok || !consensus.agreedAction) {
    return {
      ok: false,
      status: 502,
      error: consensus.reason || 'Tally aggregation consensus failed',
      consensus,
    };
  }
  const data = consensus.agreedAction.data as Record<string, unknown>;
  return {
    ok: true,
    response: {
      electionId,
      status: 'TALLYING',
      threshold: config.consensusThreshold,
      candidateOrder: data.candidateOrder as string[],
      encryptedAggregateMock: String(data.encryptedAggregateMock),
      totalEncryptedVotes: Number(data.totalEncryptedVotes ?? 0),
      consensus,
      note:
        'Prototype mock: validators returned a deterministic placeholder for the homomorphic ciphertext aggregate. The cleartext tally is not yet known to anyone.',
    },
  };
}

export interface ThresholdDecryptionResponse {
  electionId: string;
  status: 'DECRYPTED';
  threshold: number;
  decryptionShares: DecryptionShareResponse[];
  validatorIds: string[];
  combinedShareHash: string;
  consensus: ConsensusResult;
  note: string;
}

/**
 * POST /elections/:id/request-threshold-decryption
 *
 * Collects partial decryption shares from validators (≥ threshold), combines
 * them (mock: hash of sorted shares) and commits an
 * ELECTION_THRESHOLD_DECRYPTED block. The cleartext tally is recomputed
 * privately by each validator at commit time but is not yet exposed; that
 * happens in the FINISH step.
 */
export async function requestThresholdDecryption(electionId: string): Promise<
  | { ok: true; response: ThresholdDecryptionResponse }
  | { ok: false; status: number; error: string; details?: unknown }
> {
  const sharesRaw = await broadcastPost<DecryptionShareResponse>(
    '/threshold-decryption/share',
    { electionId },
  );

  const goodShares: DecryptionShareResponse[] = [];
  const errors: Array<{ url: string; error: string }> = [];
  for (const r of sharesRaw) {
    if (r.ok && r.data && r.data.partialDecryptionShare && !r.data.error) {
      goodShares.push(r.data);
    } else {
      errors.push({ url: r.url, error: r.error || r.data?.error || 'unknown' });
    }
  }

  if (goodShares.length < config.consensusThreshold) {
    return {
      ok: false,
      status: 502,
      error: `Only ${goodShares.length}/${config.consensusThreshold} threshold decryption shares collected`,
      details: { shares: goodShares, errors },
    };
  }

  // Pick threshold shares deterministically (sorted by validatorId) so all
  // validators commit identical block content.
  const sorted = [...goodShares].sort((a, b) => a.validatorId.localeCompare(b.validatorId));
  const used = sorted.slice(0, config.consensusThreshold);
  const validatorIds = used.map((s) => s.validatorId);
  const combinedShareHash =
    'mock-combined-share:' +
    createHash('sha256')
      .update(used.map((s) => s.partialDecryptionShare).sort().join('|'))
      .digest('hex');

  const consensus = await runConsensus({
    type: 'ELECTION_THRESHOLD_DECRYPTED',
    electionId,
    data: {
      decryptionShares: used,
      validatorIds,
      combinedShareHash,
    },
  });
  if (!consensus.ok) {
    return {
      ok: false,
      status: 502,
      error: consensus.reason || 'Threshold decryption commit failed',
      details: { consensus, allShares: goodShares, errors },
    };
  }

  return {
    ok: true,
    response: {
      electionId,
      status: 'DECRYPTED',
      threshold: config.consensusThreshold,
      decryptionShares: used,
      validatorIds,
      combinedShareHash,
      consensus,
      note:
        'Prototype mock: at least threshold validators contributed decryption shares. The cleartext tally has been derived privately by each validator; it will be published once /finish is called.',
    },
  };
}
