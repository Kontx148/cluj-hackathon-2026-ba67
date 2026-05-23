import { randomUUID } from 'crypto';
import { canonicalize } from './canonical';
import { config } from './config';
import { broadcastPost } from './validators-client';
import type {
  ActionPayload,
  ValidatorCommitResponse,
  ValidatorPrepareResponse,
} from './types';

export interface ConsensusResult {
  ok: boolean;
  proposalId: string;
  proposedAt: string;
  prepare: ValidatorPrepareResponse[];
  commit: ValidatorCommitResponse[];
  agreedAction?: ActionPayload;
  block?: { blockNumber: number; blockHash: string };
  reason?: string;
}

/**
 * Run a 2-phase, prepare/commit demo consensus across all validators:
 *
 *   1. Send `action` to every validator's POST /consensus/prepare.
 *   2. Each validator validates against its local state, computes the
 *      final action payload (filling in any derived fields), and returns
 *      its mock signature.
 *   3. Pick the most common `computedAction` (validators on the same chain
 *      should agree). Require ≥ CONSENSUS_THRESHOLD matching approvals.
 *   4. Send the agreed action + collected signatures to every validator's
 *      POST /consensus/commit.
 *   5. Require ≥ CONSENSUS_THRESHOLD validators to commit a block. Their
 *      blocks should have identical blockHash because the input is
 *      deterministic.
 *
 * TODO: replace with real BFT (PBFT / HotStuff / Tendermint) including
 *   leader rotation, view changes, signature aggregation (BLS), and
 *   handling of equivocation / byzantine validators.
 */
export async function runConsensus(action: ActionPayload): Promise<ConsensusResult> {
  const proposalId = randomUUID();
  const proposedAt = new Date().toISOString();

  const prepareRaw = await broadcastPost<ValidatorPrepareResponse>(
    '/consensus/prepare',
    { proposalId, proposedAt, action },
  );
  const prepare: ValidatorPrepareResponse[] = prepareRaw.map((r) => {
    if (!r.ok || !r.data) {
      return {
        validatorId: r.url,
        proposalId,
        approved: false,
        reason: r.error || 'unknown error',
      };
    }
    return r.data;
  });

  const approved = prepare.filter(
    (p) => p.approved && p.signature && p.computedAction,
  );

  // Group approvals by canonical computedAction; pick the most common one
  // that has ≥ threshold supporters.
  const groups = new Map<
    string,
    { action: ActionPayload; signatures: { validatorId: string; signature: string }[] }
  >();
  for (const p of approved) {
    const key = canonicalize(p.computedAction);
    let g = groups.get(key);
    if (!g) {
      g = { action: p.computedAction!, signatures: [] };
      groups.set(key, g);
    }
    g.signatures.push({ validatorId: p.validatorId, signature: p.signature! });
  }

  let best: { action: ActionPayload; signatures: { validatorId: string; signature: string }[] } | null = null;
  for (const g of groups.values()) {
    if (!best || g.signatures.length > best.signatures.length) best = g;
  }

  if (!best || best.signatures.length < config.consensusThreshold) {
    return {
      ok: false,
      proposalId,
      proposedAt,
      prepare,
      commit: [],
      reason:
        `Prepare phase failed: ${best?.signatures.length ?? 0}/${config.consensusThreshold} validators agreed on a payload`,
    };
  }

  const commitRaw = await broadcastPost<ValidatorCommitResponse>('/consensus/commit', {
    proposalId,
    proposedAt,
    action: best.action,
    signatures: best.signatures,
  });
  const commit: ValidatorCommitResponse[] = commitRaw.map((r) => {
    if (!r.ok || !r.data) {
      return {
        validatorId: r.url,
        proposalId,
        committed: false,
        reason: r.error || 'unknown error',
      };
    }
    return r.data;
  });

  const committed = commit.filter((c) => c.committed && c.blockHash);
  if (committed.length < config.consensusThreshold) {
    return {
      ok: false,
      proposalId,
      proposedAt,
      prepare,
      commit,
      agreedAction: best.action,
      reason: `Commit phase failed: ${committed.length}/${config.consensusThreshold} validators committed`,
    };
  }

  return {
    ok: true,
    proposalId,
    proposedAt,
    prepare,
    commit,
    agreedAction: best.action,
    block: {
      blockNumber: committed[0].blockNumber!,
      blockHash: committed[0].blockHash!,
    },
  };
}
