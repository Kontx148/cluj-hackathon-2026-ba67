import { config } from './config';
import { hashBlock } from './crypto';
import { storage } from './storage';
import type { VoteTransaction } from './types';

export interface VerifyReport {
  valid: boolean;
  issues: string[];
  blockCount: number;
  consensusThreshold: number;
}

/**
 * Walk the chain top-to-bottom and check the integrity invariants:
 *
 * 1. block.blockHash equals the hash of its content
 * 2. block.previousHash equals the previous block's blockHash
 * 3. every non-genesis block has at least CONSENSUS_THRESHOLD signatures
 * 4. no anonymousTokenHash appears twice for the same election
 * 5. votes only appear after ELECTION_OPENED and before ELECTION_FROZEN
 */
export function verifyChain(): VerifyReport {
  const issues: string[] = [];
  const blocks = storage.state.blocks;
  const seenTokens: Record<string, Set<string>> = {};
  const electionWindow: Record<
    string,
    { openedAt?: number; frozenAt?: number }
  > = {};

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
        `Block ${b.blockNumber} has invalid blockHash (expected ${expected}, got ${b.blockHash})`,
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
          `Block ${b.blockNumber} has ${b.validatorSignatures.length} signatures; need at least ${config.consensusThreshold}`,
        );
      }
    }

    for (const tx of b.transactions) {
      if (tx.type === 'ELECTION_OPENED') {
        const w = (electionWindow[tx.electionId] ||= {});
        w.openedAt = Date.parse(tx.timestamp);
      } else if (tx.type === 'ELECTION_FROZEN') {
        const w = (electionWindow[tx.electionId] ||= {});
        w.frozenAt = Date.parse(tx.timestamp);
      } else if (tx.type === 'VOTE_CAST') {
        const v = tx as VoteTransaction;
        const set = (seenTokens[v.electionId] ||= new Set());
        if (set.has(v.anonymousTokenHash)) {
          issues.push(
            `Duplicate anonymousTokenHash ${v.anonymousTokenHash} in election ${v.electionId} (block ${b.blockNumber})`,
          );
        }
        set.add(v.anonymousTokenHash);

        const w = electionWindow[v.electionId];
        const voteTs = Date.parse(v.timestamp);
        if (!w || w.openedAt === undefined) {
          issues.push(
            `Vote ${v.transactionHash} cast before election ${v.electionId} was OPENED`,
          );
        } else if (w.frozenAt !== undefined && voteTs > w.frozenAt) {
          issues.push(
            `Vote ${v.transactionHash} cast after election ${v.electionId} was FROZEN`,
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
  };
}
