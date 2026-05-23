import { computeFinalTally } from './tally';
import type {
  Approval,
  Candidate,
  DecryptionMeta,
  DecryptionShare,
  Election,
  TallyAggregate,
  Transaction,
  ValidatorState,
} from './types';

/**
 * Apply a committed transaction to the validator's election state.
 *
 * Called from /consensus/commit and from chain replay at startup.
 */
export function applyTransaction(
  state: ValidatorState,
  tx: Transaction,
): { ok: boolean; error?: string } {
  const data = tx.data as Record<string, unknown>;

  switch (tx.type) {
    case 'ELECTION_PROPOSED': {
      if (state.elections[tx.electionId]) {
        return { ok: false, error: 'election already exists' };
      }
      const election: Election = {
        electionId: tx.electionId,
        name: String(data.name || ''),
        type: String(data.type || ''),
        districts: data.districts as string[],
        candidates: data.candidates as Candidate[],
        startsAt: String(data.startsAt || ''),
        endsAt: String(data.endsAt || ''),
        requiredApprovals: Number(data.requiredApprovals ?? 2),
        electionPublicKey: String(data.electionPublicKey || ''),
        electionPrivateKey: String(data.electionPrivateKey || ''),
        status: 'PROPOSED',
        proposedBy: String(data.proposedBy || ''),
        proposedAt: tx.proposedAt,
        approvals: [],
      };
      state.elections[tx.electionId] = election;
      state.usedTokensByElection[tx.electionId] = [];
      return { ok: true };
    }

    case 'ELECTION_APPROVED': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      const approval: Approval = {
        institutionId: String(data.institutionId || ''),
        approvedAt: String(data.approvedAt || tx.proposedAt),
      };
      if (!e.approvals.some((a) => a.institutionId === approval.institutionId)) {
        e.approvals.push(approval);
      }
      if (e.approvals.length >= e.requiredApprovals && e.status === 'PROPOSED') {
        e.status = 'APPROVED';
      }
      return { ok: true };
    }

    case 'ELECTION_OPENED': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      e.status = 'OPEN';
      e.openedAt = tx.proposedAt;
      return { ok: true };
    }

    case 'ELECTION_FROZEN': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      e.status = 'FROZEN';
      e.frozenAt = tx.proposedAt;
      return { ok: true };
    }

    case 'VOTE_CAST': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      const token = String(data.anonymousTokenHash || '');
      const used = (state.usedTokensByElection[tx.electionId] ||= []);
      if (!used.includes(token)) used.push(token);
      return { ok: true };
    }

    case 'ELECTION_TALLY_AGGREGATED': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      const aggregate: TallyAggregate = {
        candidateOrder: data.candidateOrder as string[],
        encryptedAggregateMock: String(data.encryptedAggregateMock || ''),
        totalEncryptedVotes: Number(data.totalEncryptedVotes ?? 0),
        aggregatedAt: tx.proposedAt,
      };
      e.tallyAggregate = aggregate;
      e.status = 'TALLYING';
      return { ok: true };
    }

    case 'ELECTION_THRESHOLD_DECRYPTED': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      const shares = (data.decryptionShares as DecryptionShare[]) || [];
      const validatorIds = (data.validatorIds as string[]) || [];
      const combinedShareHash = String(data.combinedShareHash || '');
      const meta: DecryptionMeta = {
        decryptionShares: shares,
        validatorIds,
        combinedShareHash,
        decryptedAt: tx.proposedAt,
      };
      e.decryptionMeta = meta;
      // Recompute the cleartext tally locally from VOTE_CAST blocks. The
      // result is stored privately and only revealed publicly on FINISHED.
      e.tally = computeFinalTally(state.blocks, e, shares);
      e.status = 'DECRYPTED';
      return { ok: true };
    }

    case 'ELECTION_FINISHED': {
      const e = state.elections[tx.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      e.status = 'FINISHED';
      e.finishedAt = tx.proposedAt;
      e.publishedTally = e.tally;
      return { ok: true };
    }

    default:
      return { ok: false, error: `unknown transaction type: ${(tx as Transaction).type}` };
  }
}

/**
 * Replay all blocks to rebuild election state from a freshly loaded chain.
 * Called once at startup after `storage.load()`.
 */
export function replayState(state: ValidatorState): void {
  state.elections = {};
  state.usedTokensByElection = {};
  for (const block of state.blocks) {
    for (const tx of block.transactions) {
      applyTransaction(state, tx);
    }
  }
}
