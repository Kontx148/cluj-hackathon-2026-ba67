import { config } from './config';
import { hashBlock } from './crypto';
import { storage } from './storage';

export interface VerifyReport {
  valid: boolean;
  issues: string[];
  blockCount: number;
  consensusThreshold: number;
  head: string | null;
}

/**
 * Walk the chain and check the integrity invariants required by the spec:
 *
 *   1. block.blockHash matches the hash of its content
 *   2. block.previousHash links to the previous block
 *   3. every non-genesis block carries ≥ CONSENSUS_THRESHOLD signatures
 *   4. no anonymousTokenHash appears twice in the same election
 *   5. no digitalIdHash appears twice in the same election
 *   6. votes only appear inside [ELECTION_OPENED, ELECTION_FROZEN]
 */
export function verifyChain(): VerifyReport {
  const issues: string[] = [];
  const blocks = storage.state.blocks;
  const seenTokens: Record<string, Set<string>> = {};
  const seenDigitalIdHashes: Record<string, Set<string>> = {};
  const electionWindow: Record<string, { openedAt?: number; frozenAt?: number }> = {};

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    const expected = hashBlock({
      blockNumber: b.blockNumber,
      previousHash: b.previousHash,
      timestamp: b.timestamp,
      transactions: b.transactions,
      validatorSignatures: b.validatorSignatures,
    });
    if (expected !== b.blockHash) {
      issues.push(
        `Block ${b.blockNumber} blockHash mismatch (expected ${expected}, got ${b.blockHash})`,
      );
    }

    if (i > 0) {
      const prev = blocks[i - 1];
      if (b.previousHash !== prev.blockHash) {
        issues.push(
          `Block ${b.blockNumber} previousHash does not link to block ${prev.blockNumber}`,
        );
      }
      if (b.validatorSignatures.length < config.consensusThreshold) {
        issues.push(
          `Block ${b.blockNumber} has ${b.validatorSignatures.length} signatures; need ${config.consensusThreshold}`,
        );
      }
    }

    for (const tx of b.transactions) {
      if (tx.type === 'ELECTION_OPENED') {
        const w = (electionWindow[tx.electionId] ||= {});
        w.openedAt = Date.parse(tx.proposedAt);
      } else if (tx.type === 'ELECTION_FROZEN') {
        const w = (electionWindow[tx.electionId] ||= {});
        w.frozenAt = Date.parse(tx.proposedAt);
      } else if (tx.type === 'VOTE_CAST') {
        const data = tx.data as Record<string, unknown>;
        const token = String(data.anonymousTokenHash || '');
        const set = (seenTokens[tx.electionId] ||= new Set());
        if (set.has(token)) {
          issues.push(
            `Duplicate anonymousTokenHash ${token} in election ${tx.electionId} (block ${b.blockNumber})`,
          );
        }
        set.add(token);

        const digitalIdHash = String(data.digitalIdHash || '');
        const seenIds = (seenDigitalIdHashes[tx.electionId] ||= new Set());
        if (digitalIdHash && seenIds.has(digitalIdHash)) {
          issues.push(
            `Duplicate digitalIdHash ${digitalIdHash} in election ${tx.electionId} (block ${b.blockNumber})`,
          );
        }
        if (digitalIdHash) seenIds.add(digitalIdHash);

        const voteTs = Date.parse(String(data.voteTimestamp || ''));
        const w = electionWindow[tx.electionId];
        if (!w || w.openedAt === undefined) {
          issues.push(
            `Vote ${tx.transactionHash} cast before election ${tx.electionId} was OPENED`,
          );
        } else if (w.frozenAt !== undefined && voteTs > w.frozenAt) {
          issues.push(
            `Vote ${tx.transactionHash} cast after election ${tx.electionId} was FROZEN`,
          );
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    blockCount: blocks.length,
    consensusThreshold: config.consensusThreshold,
    head: blocks.length ? blocks[blocks.length - 1].blockHash : null,
  };
}
